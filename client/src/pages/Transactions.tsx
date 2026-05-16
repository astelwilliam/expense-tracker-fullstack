import { useEffect, useState } from "react";
import api from "../services/api";
import MainLayout from "../layouts/MainLayout";

interface Transaction {
  _id: string;
  title: string;
  amount: number;
}

function Transactions() {
  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");

  const fetchTransactions = async () => {
    try {
      const response = await api.get(
        "/transactions"
      );

      setTransactions(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    try {
      await api.post("/transactions", {
        title,
        amount: Number(amount),
      });

      setTitle("");
      setAmount("");

      fetchTransactions();
    } catch (error) {
      console.log(error);
    }
  };

  const handleDelete = async (
    id: string
  ) => {
    try {
      await api.delete(
        `/transactions/${id}`
      );

      fetchTransactions();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <MainLayout>
      <h1 className="text-4xl font-bold mb-6">
        Transactions
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-zinc-900 p-6 rounded-2xl mb-6 space-y-4"
      >
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) =>
            setTitle(e.target.value)
          }
          className="w-full p-3 rounded-xl bg-zinc-800 text-white"
          required
        />

        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) =>
            setAmount(e.target.value)
          }
          className="w-full p-3 rounded-xl bg-zinc-800 text-white"
          required
        />

        <button
          type="submit"
          className="bg-green-500 px-5 py-3 rounded-xl font-bold"
        >
          Add Transaction
        </button>
      </form>

      <div className="space-y-4">
        {transactions.map((transaction) => (
          <div
            key={transaction._id}
            className="bg-zinc-900 p-4 rounded-xl flex justify-between"
          >
            <span>
              {transaction.title}
            </span>

            <div className="flex items-center gap-4">
              <span>
                ₹{transaction.amount}
              </span>

              <button
                onClick={() =>
                  handleDelete(
                    transaction._id
                  )
                }
                className="bg-red-500 px-3 py-1 rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </MainLayout>
  );
}

export default Transactions;