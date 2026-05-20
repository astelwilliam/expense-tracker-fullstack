let transactions = [];

export const getTransactions = async (
  req,
  res
) => {
  res.json(transactions);
};

export const addTransaction = async (
  req,
  res
) => {
  const transaction = {
    _id:
      Date.now().toString(),
    ...req.body,
  };

  transactions.unshift(
    transaction
  );

  res
    .status(201)
    .json(transaction);
};

export const updateTransaction =
  async (req, res) => {
    const { id } =
      req.params;

    transactions =
      transactions.map(
        (transaction) =>
          transaction._id === id
            ? {
                ...transaction,
                ...req.body,
              }
            : transaction
      );

    res.json({
      message:
        "Transaction updated",
    });
  };

export const deleteTransaction =
  async (req, res) => {
    const { id } =
      req.params;

    transactions =
      transactions.filter(
        (transaction) =>
          transaction._id !==
          id
      );

    res.json({
      message:
        "Transaction deleted",
    });
  };