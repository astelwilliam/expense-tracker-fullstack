const mongoose = require("mongoose");

const transactionSchema =
  new mongoose.Schema(
    {
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
        enum: [
          "Food",
          "Salary",
          "Shopping",
          "Bills",
          "Travel",
          "Entertainment",
          "Other",
        ],
      },

      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
    {
      timestamps: true,
    }
  );

module.exports = mongoose.model(
  "Transaction",
  transactionSchema
);