import { useEffect, useState } from "react";

import toast from "react-hot-toast";

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

  const [isAdding, setIsAdding] =
    useState(false);

  const [isUpdating, setIsUpdating] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      const response = await api.get(
        "/transactions"
      );

      setTransactions(response.data);
    } catch (error) {
      toast.error(
        "Failed to load transactions"
      );
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
      setIsAdding(true);

      await api.post(
        "/transactions",
        {
          title,
          amount: Number(amount),
        }
      );

      toast.success(
        "Transaction added"
      );

      setTitle("");

      setAmount("");

      fetchTransactions();

      setIsAdding(false);
    } catch (error) {
      setIsAdding(false);

      toast.error(
        "Failed to add transaction"
      );
    }
  };

  const handleDelete = async (
    id: string
  ) => {
    try {
      setDeletingId(id);

      await api.delete(
        `/transactions/${id}`
      );

      toast.success(
        "Transaction deleted"
      );

      fetchTransactions();

      setDeletingId(null);
    } catch (error) {
      setDeletingId(null);

      toast.error(
        "Failed to delete transaction"
      );
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
      setIsUpdating(true);

      await api.put(
        `/transactions/${id}`,
        {
          title: editTitle,
          amount:
            Number(editAmount),
        }
      );

      toast.success(
        "Transaction updated"
      );

      setEditingId(null);

      fetchTransactions();

      setIsUpdating(false);
    } catch (error) {
      setIsUpdating(false);

      toast.error(
        "Failed to update transaction"
      );
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
          disabled={isAdding}
          className="bg-green-500 hover:bg-green-600 disabled:opacity-50 px-5 py-3 rounded-xl font-bold transition"
        >
          {isAdding
            ? "Adding..."
            : "Add Transaction"}
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
                      disabled={
                        isUpdating
                      }
                      className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 px-4 py-2 rounded-lg"
                    >
                      {isUpdating
                        ? "Saving..."
                        : "Save"}
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
                      disabled={
                        deletingId ===
                        transaction._id
                      }
                      className="bg-red-500 hover:bg-red-600 disabled:opacity-50 px-4 py-2 rounded-lg"
                    >
                      {deletingId ===
                      transaction._id
                        ? "Deleting..."
                        : "Delete"}
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