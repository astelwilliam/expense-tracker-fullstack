import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Transaction from "../src/models/Transaction.js";
import Category from "../src/models/Category.js";
import { duplicateStatus } from "../src/controllers/smartImportController.js";

const uri = process.env.MONGO_TEST_URI;
const prefix = `phase42_${Date.now()}_`;
function assertTestUri() {
  if (!uri || !/^mongodb(?:\+srv)?:\/\//.test(uri) || !/\/expense_tracker_test(?:\?|$)/.test(uri) || process.env.MONGO_URI) throw new Error("Integration tests require only MONGO_TEST_URI for expense_tracker_test");
}

test("staging MongoDB isolates users, persists imports, categories, and duplicate protection", async (t) => {
  assertTestUri();
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  assert.equal(mongoose.connection.name, "expense_tracker_test");
  const alice = new mongoose.Types.ObjectId(); const bob = new mongoose.Types.ObjectId();
  t.after(async () => { await Transaction.deleteMany({ title: new RegExp(`^${prefix}`) }); await Category.deleteMany({ name: new RegExp(`^${prefix}`) }); await mongoose.disconnect(); });
  const row = await Transaction.create({ user: alice, title: `${prefix}Zomato`, amount: -450, category: "Food", type: "expense", transactionDate: "2026-11-10", referenceId: `${prefix}UPI123456` });
  assert.equal((await Transaction.find({ user: bob, _id: row._id })).length, 0);
  const status = duplicateStatus({ title: row.title, amount: 450, type: "expense", transactionDate: row.transactionDate, referenceId: row.referenceId }, [row]);
  assert.equal(status.status, "exact");
  const category = await Category.create({ user: alice, name: `${prefix}Pets` });
  assert.equal((await Category.find({ user: bob, _id: category._id })).length, 0);
  await mongoose.disconnect(); await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  assert.equal((await Transaction.find({ user: alice, _id: row._id })).length, 1);
});
