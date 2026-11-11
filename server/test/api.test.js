import test from "node:test";
import assert from "node:assert/strict";

// HTTP tests with stubbed database methods. These verify JWT, ownership filters,
// and API behavior, but do NOT replace testing with a real MongoDB instance.
test("signup, login, JWT, validation and cross-user transaction isolation", async (t) => {
  let appModule, User, Transaction, mongoose;
  try {
    const modules = await Promise.all([
      import("../src/app.js"),
      import("../src/models/User.js"),
      import("../src/models/Transaction.js"),
      import("mongoose"),
    ]);
    appModule = modules[0];
    User = modules[1].default;
    Transaction = modules[2].default;
    mongoose = modules[3].default;
  } catch (err) {
    if (err.code === "ERR_MODULE_NOT_FOUND" && /Cannot find package ['"](?:express|cors|mongoose|bcryptjs|jsonwebtoken)['"]/.test(err.message)) {
      t.skip("Install server dependencies with npm ci to run HTTP tests");
      return;
    }
    throw err;
  }

  process.env.JWT_SECRET = "test-secret-for-local-testing-only-0123456789";
  process.env.CLIENT_ORIGIN = "http://localhost:5173";
  const users = new Map();
  const rows = new Map();
  const originals = {
    userExists: User.exists,
    userCreate: User.create,
    userFindOne: User.findOne,
    txFind: Transaction.find,
    txCreate: Transaction.create,
    txUpdate: Transaction.findOneAndUpdate,
    txDelete: Transaction.findOneAndDelete,
    txBulk: Transaction.insertMany,
  };
  User.exists = async ({ email }) => users.has(email);
  User.create = async (data) => {
    const row = { _id: new mongoose.Types.ObjectId(), ...data };
    users.set(data.email, row);
    return row;
  };
  User.findOne = async ({ email }) => users.get(email) || null;
  Transaction.find = ({ user, _id }) => {
    let data = [...rows.values()].filter(row => row.user === user);
    if (_id?.$in) data = data.filter(row => _id.$in.some(id => String(id) === String(row._id)));
    const query = { sort: () => query, limit: () => query, select: () => query, lean: async () => data };
    query.then = (resolve, reject) => Promise.resolve(data).then(resolve, reject);
    return query;
  };
  Transaction.insertMany = async (items) => items.map(row => {
    const doc = { ...row, _id: new mongoose.Types.ObjectId().toString(), createdAt: new Date().toISOString() };
    rows.set(doc._id, doc);
    return doc;
  });
  Transaction.create = async (data) => {
    const row = { _id: new mongoose.Types.ObjectId().toString(), ...data, createdAt: new Date().toISOString() };
    rows.set(row._id, row);
    return row;
  };
  Transaction.findOneAndUpdate = async ({ _id, user }, { $set }) => {
    const row = rows.get(_id);
    if (!row || row.user !== user) return null;
    Object.assign(row, $set);
    return row;
  };
  Transaction.findOneAndDelete = async ({ _id, user }) => {
    const row = rows.get(_id);
    if (!row || row.user !== user) return null;
    rows.delete(_id);
    return row;
  };
  const server = appModule.createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const api = async (path, method = "GET", body, token) => {
    const response = await fetch(origin + path, {
      method,
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, headers: response.headers, data: response.status === 204 ? null : await response.json() };
  };
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    User.exists = originals.userExists;
    User.create = originals.userCreate;
    User.findOne = originals.userFindOne;
    Transaction.find = originals.txFind;
    Transaction.create = originals.txCreate;
    Transaction.findOneAndUpdate = originals.txUpdate;
    Transaction.findOneAndDelete = originals.txDelete;
    Transaction.insertMany = originals.txBulk;
  });

  const protectedResponse = await api("/api/transactions");
  assert.equal(protectedResponse.status, 401);
  assert.equal(protectedResponse.headers.get("x-content-type-options"), "nosniff");
  assert.match(protectedResponse.headers.get("content-security-policy"), /default-src 'self'/);
  const ada = await api("/api/auth/signup", "POST", {
    name: "Ada", email: "Ada@EXAMPLE.com", password: "securepassword!",
  });
  assert.equal(ada.status, 201);
  assert.ok(ada.data.token);
  assert.equal(ada.data.user.email, "ada@example.com");
  assert.equal(ada.data.user.password, undefined);
  assert.equal((await api("/api/auth/signup", "POST", {
    name: "Ada", email: "ada@example.com", password: "securepassword!",
  })).status, 409);
  assert.equal((await api("/api/auth/login", "POST", { email: "ada@example.com", password: "wrong" })).status, 401);
  assert.equal((await api("/api/auth/login", "POST", {
    email: "ADA@example.com", password: "securepassword!",
  })).status, 200);
  assert.equal((await api("/api/transactions", "GET", undefined, "not.a.jwt")).status, 401);

  const bob = await api("/api/auth/signup", "POST", {
    name: "Bob", email: "bob@example.com", password: "securepassword!",
  });
  assert.equal(bob.status, 201);
  const payload = { title: "Dinner", amount: -245.25, category: "Food", transactionDate: "2026-11-10" };
  assert.equal((await api("/api/transactions", "POST", { ...payload, amount: 0 }, ada.data.token)).status, 400);
  const added = await api("/api/transactions", "POST", { ...payload, user: bob.data.user.id }, ada.data.token);
  assert.equal(added.status, 201);
  assert.equal(added.data.user, ada.data.user.id);
  assert.equal(added.data.type, "expense");
  assert.equal(added.data.transactionDate, "2026-11-10");
  // Export is authenticated and generates a real Excel workbook.
  assert.equal((await api('/api/transactions/export?format=xlsx')).status, 401);
  const fileResponse = await fetch(`${origin}/api/transactions/export?format=xlsx`, {
    headers: {Authorization: `Bearer ${ada.data.token}`},
  });
  assert.equal(fileResponse.status, 200);
  assert.match(fileResponse.headers.get('content-type'), /spreadsheetml/);
  const excelData = Buffer.from(await fileResponse.arrayBuffer()).toString('base64');
  const previewSelf = await api('/api/transactions/import/preview','POST',{format:'xlsx',data:excelData},ada.data.token);
  assert.equal(previewSelf.status, 200);
  assert.equal(previewSelf.data.alreadyImported, 1);
  assert.equal(previewSelf.data.toImport, 0);
  const previewOther = await api('/api/transactions/import/preview','POST',{format:'xlsx',data:excelData},bob.data.token);
  assert.equal(previewOther.data.toImport,1);
  const importedOther = await api('/api/transactions/import','POST',{format:'xlsx',data:excelData},bob.data.token);
  assert.equal(importedOther.status,201);
  assert.equal(importedOther.data.imported,1);
  assert.equal((await api('/api/transactions','GET',undefined,bob.data.token)).data.length,1);
  assert.equal((await api('/api/transactions/import','POST',{format:'csv',data:Buffer.from('bad').toString('base64')},ada.data.token)).status,400);
  const template = await fetch(`${origin}/api/transactions/template`, {headers:{Authorization:`Bearer ${ada.data.token}`}});
  assert.equal(template.status,200);
  assert.ok((await template.text()).includes('Transaction ID'));
  const id = added.data._id;
  assert.equal((await api("/api/transactions", "GET", undefined, bob.data.token)).data.length, 1);
  assert.equal((await api(`/api/transactions/${id}`, "PUT", payload, bob.data.token)).status, 404);
  assert.equal((await api(`/api/transactions/${id}`, "DELETE", undefined, bob.data.token)).status, 404);
  assert.equal((await api("/api/transactions", "GET", undefined, ada.data.token)).data.length, 1);
  const updated = await api(`/api/transactions/${id}`, "PUT", {
    title: "Dinner updated", amount: -300, category: "Food", transactionDate: "2026-11-09",
  }, ada.data.token);
  assert.equal(updated.status, 200);
  assert.equal(updated.data.title, "Dinner updated");
  assert.equal(updated.data.transactionDate, "2026-11-09");
  assert.equal((await api(`/api/transactions/${id}`, "DELETE", undefined, ada.data.token)).status, 204);
  assert.equal((await api("/api/transactions", "GET", undefined, ada.data.token)).data.length, 0);
});
