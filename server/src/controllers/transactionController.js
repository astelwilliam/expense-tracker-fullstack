const Transaction = require(
  "../models/Transaction"
);

const getTransactions = async (
  req,
  res
) => {
  try {
    const transactions =
      await Transaction.find({
        user: req.user.id,
      }).sort({
        createdAt: -1,
      });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const addTransaction = async (
  req,
  res
) => {
  try {
    const { title, amount } =
      req.body;

    const transaction =
      await Transaction.create({
        title,
        amount,
        user: req.user.id,
      });

    res.status(201).json(
      transaction
    );
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const deleteTransaction = async (
  req,
  res
) => {
  try {
    const transaction =
      await Transaction.findById(
        req.params.id
      );

    if (!transaction) {
      return res.status(404).json({
        message:
          "Transaction not found",
      });
    }

    if (
      transaction.user.toString() !==
      req.user.id
    ) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    await transaction.deleteOne();

    res.json({
      message:
        "Transaction deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getTransactions,
  addTransaction,
  deleteTransaction,
};