let transactions = [];

export const getTransactions = async (
  req,
  res
) => {
  try {
    res.json(transactions);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const addTransaction = async (
  req,
  res
) => {
  try {
    const transaction = {
      id: Date.now().toString(),
      ...req.body,
    };

    transactions.push(transaction);

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const updateTransaction = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    transactions = transactions.map(
      (transaction) =>
        transaction.id === id
          ? {
              ...transaction,
              ...req.body,
            }
          : transaction
    );

    res.json({
      message: "Transaction updated",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const deleteTransaction = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    transactions = transactions.filter(
      (transaction) =>
        transaction.id !== id
    );

    res.json({
      message: "Transaction deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};