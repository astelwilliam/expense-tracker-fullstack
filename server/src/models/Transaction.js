import mongoose from "mongoose";

const transactionSchema =
  new mongoose.Schema(
    {
      user: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "User",

        required: true,
      },

      title: {
        type: String,
        required: true,
      },

      amount: {
        type: Number,
        required: true,
      },

      category: {
        type: String,
        required: true,
      },

      type: {
        type: String,
        enum: [
          "income",
          "expense",
        ],
        required: true,
      },
    },
    {
      timestamps: true,
    }
  );

const Transaction =
  mongoose.model(
    "Transaction",
    transactionSchema
  );

export default Transaction;

