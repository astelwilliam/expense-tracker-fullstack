import test from "node:test";
import assert from "node:assert/strict";
import { validateLogin, validateSignup, validateTransaction } from "../src/utils/validation.js";

test("signup validates, normalizes email, and enforces password limits", () => {
  const result = validateSignup({ name: "  Ada  ", email: "  ADA@Example.COM ", password: "strongpassword!" });
  assert.deepEqual(result.value, { name: "Ada", email: "ada@example.com", password: "strongpassword!" });
  assert.ok(validateSignup({ name: "A", email: "a@b.co", password: "short" }).error);
  assert.ok(validateSignup({ name: "A", email: "a@b.co", password: "😀".repeat(20) }).error);
  assert.ok(validateSignup({}).error);
});

test("login uses normalized email and requires password", () => {
  assert.equal(validateLogin({ email: " X@Y.COM ", password: "p" }).value.email, "x@y.com");
  assert.ok(validateLogin({ email: "X@Y.COM" }).error);
});

test("transaction validation rejects injection, invalid, or unsafe values", () => {
  assert.deepEqual(validateTransaction({ title: "Lunch", amount: -105.5, category: "Food", user: "spoofed" }).value,
    { title: "Lunch", amount: -105.5, category: "Food", type: "expense" });
  assert.equal(validateTransaction({ title: "Pay", amount: 100, category: "Salary" }).value.type, "income");
  for (const amount of [0, Infinity, NaN, 1.001, "500", 1e12]) {
    assert.ok(validateTransaction({ title: "Bad", amount, category: "Food" }).error);
  }
  assert.equal(validateTransaction({ title: "Custom category", amount: -10, category: "Household" }).value.category, "Household");
  assert.ok(validateTransaction({ title: { $gt: "" }, amount: -10, category: "Food" }).error);
  assert.ok(validateTransaction({ title: "Bad", amount: -10, category: "Food", type: "credit" }).error);
  assert.ok(validateTransaction({ title: "Bad", amount: -10, category: "Food", type: "income" }).error);
  assert.equal(validateTransaction({ title: "Pay", amount: 10, category: "Salary", type: "income" }).value.type, "income");
});


test("transaction dates validate calendar days without altering signed amounts", () => {
  const row = validateTransaction({ title: "Coffee", amount: -45.5, category: "Food", transactionDate: "2026-11-10" });
  assert.deepEqual(row.value, {
    title: "Coffee", amount: -45.5, category: "Food", type: "expense", transactionDate: "2026-11-10",
  });
  for (const transactionDate of ["2026-02-30", "2026-13-01", "2026-11-1", "tomorrow", 1234, null]) {
    assert.ok(validateTransaction({ title: "Bad", amount: 100, category: "Salary", transactionDate }).error);
  }
  assert.equal(validateTransaction({ title: "Legacy", amount: 100, category: "Salary" }).value.transactionDate, undefined);
});
