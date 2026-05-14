import { useState } from "react";
import MainLayout from "../layouts/MainLayout";
import TransactionCard from "../components/TransactionCard";
import { transactions as initialTransactions } from "../data/transactions";

function Transactions() {
  const [transactions, setTransactions] =
    useState(initialTransactions);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");

  const handleAddTransaction = () => {
    if (!title || !amount) return;

    const newTransaction = {
      id: Date.now(),
      title,
      amount: Number(amount),
    };

    setTransactions([
      newTransaction,
      ...transactions,
    ]);

    setTitle("");
    setAmount("");
  };

  const handleDeleteTransaction = (id: number) => {
    setTransactions(
      transactions.filter(
        (transaction) => transaction.id !== id
      )
    );
  };

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">
          Transactions
        </h1>
      </div>

      <div className="bg-zinc-900 p-6 rounded-2xl mb-8">
        <h2 className="text-2xl font-bold mb-5">
          Add Transaction
        </h2>

        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Transaction Title"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            className="flex-1 bg-zinc-800 text-white p-3 rounded-xl outline-none"
          />

          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) =>
              setAmount(e.target.value)
            }
            className="w-40 bg-zinc-800 text-white p-3 rounded-xl outline-none"
          />

          <button
            onClick={handleAddTransaction}
            className="bg-white text-black px-5 rounded-xl font-medium hover:bg-zinc-200 transition"
          >
            Add
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {transactions.map((transaction) => (
          <TransactionCard
            key={transaction.id}
            id={transaction.id}
            title={transaction.title}
            amount={transaction.amount}
            onDelete={handleDeleteTransaction}
          />
        ))}
      </div>
    </MainLayout>
  );
}

export default Transactions;