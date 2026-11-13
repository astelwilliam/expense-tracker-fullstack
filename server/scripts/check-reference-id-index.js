import "dotenv/config";
import mongoose from "mongoose";
import Transaction from "../src/models/Transaction.js";

const uri = process.env.MONGO_TEST_URI;
if (!uri || !/\/expense_tracker_test(?:\?|$)/.test(uri)) {
  throw new Error("Set MONGO_TEST_URI to the dedicated expense_tracker_test database; production is never accepted.");
}

await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
const duplicates = await Transaction.aggregate([
  { $match: { referenceId: { $type: "string", $ne: "" } } },
  { $project: { user: 1, referenceId: { $toUpper: { $trim: { input: "$referenceId" } } } } },
  { $group: { _id: { user: "$user", referenceId: "$referenceId" }, count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } },
  { $limit: 20 },
]);
console.log(JSON.stringify({ database: mongoose.connection.name, duplicateGroups: duplicates.length, ready: duplicates.length === 0 }));
console.log("Proposed only (not applied): db.transactions.createIndex({ user: 1, referenceId: 1 }, { unique: true, partialFilterExpression: { referenceId: { $type: 'string' } }, name: 'unique_user_reference_id' })");
await mongoose.disconnect();
