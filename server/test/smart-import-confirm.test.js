import test from "node:test";
import assert from "node:assert/strict";
import Transaction from "../src/models/Transaction.js";
import { confirmSmartCandidates } from "../src/controllers/smartImportController.js";
import { validateTransaction } from "../src/utils/validation.js";

const candidate = (referenceId) => ({ title: "Synthetic purchase", amount: -450, type: "expense", category: "Food", transactionDate: "2026-11-10", ...(referenceId ? { referenceId } : {}) });
const response = () => { const value = { statusCode: 200, body: undefined, status(code) { value.statusCode = code; return value; }, json(body) { value.body = body; return value; } }; return value; };

test("reference IDs are canonicalized while reference-free legacy rows remain valid", () => {
  assert.equal(validateTransaction(candidate("upi-ab_123")).value.referenceId, "UPI-AB_123");
  assert.equal(Object.hasOwn(validateTransaction(candidate()).value, "referenceId"), false);
});

test("Smart Import preserves references, blocks exact matches, and maps concurrent unique-index conflicts", async (t) => {
  const originalFind = Transaction.find; const originalInsert = Transaction.insertMany;
  t.after(() => { Transaction.find = originalFind; Transaction.insertMany = originalInsert; });
  const inserts = [];
  Transaction.find = () => ({ select: () => ({ lean: async () => [] }) });
  Transaction.insertMany = async (rows) => { inserts.push(rows); return rows; };
  const first = response(); await confirmSmartCandidates({ body: { candidates: [candidate("upi-ab_123")] }, user: { id: "user-a" } }, first, () => {});
  assert.equal(first.statusCode, 201); assert.equal(inserts[0][0].referenceId, "UPI-AB_123");

  Transaction.find = () => ({ select: () => ({ lean: async () => [{ referenceId: "upi-ab_123" }] }) });
  const duplicate = response(); await confirmSmartCandidates({ body: { candidates: [candidate("UPI-AB_123")] }, user: { id: "user-a" } }, duplicate, () => {});
  assert.equal(duplicate.statusCode, 409);

  Transaction.find = () => ({ select: () => ({ lean: async () => [] }) });
  Transaction.insertMany = async () => { const error = new Error("duplicate key"); error.code = 11000; throw error; };
  const concurrent = response(); await confirmSmartCandidates({ body: { candidates: [candidate("UPI-AB_123")] }, user: { id: "user-a" } }, concurrent, () => {});
  assert.equal(concurrent.statusCode, 409);
});
