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

  const [title, setTitle] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [editTitle, setEditTitle] =
    useState("");

  const [editAmount, setEditAmount] =
    useState("");

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
      await api.post(
        "/transactions",
        {
          title,
          amount: Number(amount),
        }
      );

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

  const startEditing = (
    transaction: Transaction
  ) => {
    setEditingId(transaction._id);

    setEditTitle(transaction.title);

    setEditAmount(
      transaction.amount.toString()
    );
  };

  const cancelEditing = () => {
    setEditingId(null);

    setEditTitle("");

    setEditAmount("");
  };

  const handleUpdate = async (
    id: string
  ) => {
    try {
      await api.put(
        `/transactions/${id}`,
        {
          title: editTitle,
          amount:
            Number(editAmount),
        }
      );

      setEditingId(null);

      fetchTransactions();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <MainLayout>
      <h1 className="text-3xl md:text-4xl font-bold mb-6">
        Transactions
      </h1>

      {/* ADD FORM */}

      <form
        onSubmit={handleSubmit}
        className="bg-zinc-900 p-4 md:p-6 rounded-2xl mb-6 space-y-4"
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
          className="bg-green-500 hover:bg-green-600 px-5 py-3 rounded-xl font-bold transition"
        >
          Add Transaction
        </button>
      </form>

      {/* TRANSACTIONS */}

      <div className="space-y-4">
        {transactions.map(
          (transaction) => (
            <div
              key={transaction._id}
              className="bg-zinc-900 p-4 rounded-xl"
            >
              {editingId ===
              transaction._id ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) =>
                      setEditTitle(
                        e.target.value
                      )
                    }
                    className="w-full p-3 rounded-xl bg-zinc-800 text-white"
                  />

                  <input
                    type="number"
                    value={editAmount}
                    onChange={(e) =>
                      setEditAmount(
                        e.target.value
                      )
                    }
                    className="w-full p-3 rounded-xl bg-zinc-800 text-white"
                  />

                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        handleUpdate(
                          transaction._id
                        )
                      }
                      className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg"
                    >
                      Save
                    </button>

                    <button
                      onClick={
                        cancelEditing
                      }
                      className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-lg">
                      {
                        transaction.title
                      }
                    </h2>

                    <p
                      className={`text-sm ${
                        transaction.amount >
                        0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      ₹
                      {
                        transaction.amount
                      }
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        startEditing(
                          transaction
                        )
                      }
                      className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded-lg"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(
                          transaction._id
                        )
                      }
                      className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </MainLayout>
  );
}

export default Transactions;