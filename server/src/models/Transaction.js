import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    amount: { type: Number, required: true },
    category: { type: String, required: true, trim: true, maxlength: 50 },
    type: { type: String, enum: ["income", "expense"], required: true },
    referenceId: { type: String, trim: true, maxlength: 80 },
    // Optional for backwards compatibility with transactions created before V1.1.
    transactionDate: { type: String, match: /^\d{4}-\d{2}-\d{2}$/ },
  },
  { timestamps: true },
);
transactionSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("Transaction", transactionSchema);
