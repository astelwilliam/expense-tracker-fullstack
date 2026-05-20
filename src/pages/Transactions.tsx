import {
  useEffect,
  useState,
} from "react";

import toast from "react-hot-toast";

import api from "../services/api";

import MainLayout from "../layouts/MainLayout";

interface Transaction {
  _id: string;
  title: string;
  amount: number;
  category: string;
}

const categories = [
  "Food",
  "Salary",
  "Shopping",
  "Bills",
  "Travel",
  "Entertainment",
  "Other",
];

function Transactions() {
  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [title, setTitle] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [category, setCategory] =
    useState("Other");

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [editTitle, setEditTitle] =
    useState("");

  const [editAmount, setEditAmount] =
    useState("");

  const [editCategory, setEditCategory] =
    useState("Other");

  const fetchTransactions =
    async () => {
      try {
        const response =
          await api.get(
            "/transactions"
          );

        setTransactions(
          response.data
        );
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
      await api.post(
        "/transactions",
        {
          title,
          amount:
            Number(amount),
          category,
        }
      );

      toast.success(
        "Transaction added"
      );

      setTitle("");
      setAmount("");
      setCategory("Other");

      fetchTransactions();
    } catch (error) {
      toast.error(
        "Failed to add transaction"
      );
    }
  };

  const handleDelete =
    async (id: string) => {
      try {
        await api.delete(
          `/transactions/${id}`
        );

        toast.success(
          "Transaction deleted"
        );

        fetchTransactions();
      } catch (error) {
        toast.error(
          "Failed to delete transaction"
        );
      }
    };

  const startEditing = (
    transaction: Transaction
  ) => {
    setEditingId(
      transaction._id
    );

    setEditTitle(
      transaction.title
    );

    setEditAmount(
      transaction.amount.toString()
    );

    setEditCategory(
      transaction.category
    );
  };

  const handleUpdate =
    async (id: string) => {
      try {
        await api.put(
          `/transactions/${id}`,
          {
            title: editTitle,
            amount:
              Number(
                editAmount
              ),
            category:
              editCategory,
          }
        );

        toast.success(
          "Transaction updated"
        );

        setEditingId(null);

        fetchTransactions();
      } catch (error) {
        toast.error(
          "Failed to update transaction"
        );
      }
    };

  return (
    <MainLayout>
      <div className="p-6 text-white">
        <h1 className="text-4xl font-bold mb-8">
          Transactions
        </h1>

        {/* ADD FORM */}

        <form
          onSubmit={
            handleSubmit
          }
          className="bg-zinc-900 p-6 rounded-2xl mb-8 space-y-4"
        >
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) =>
              setTitle(
                e.target.value
              )
            }
            className="w-full p-3 rounded-xl bg-zinc-800 text-white"
            required
          />

          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) =>
              setAmount(
                e.target.value
              )
            }
            className="w-full p-3 rounded-xl bg-zinc-800 text-white"
            required
          />

          <select
            value={category}
            onChange={(e) =>
              setCategory(
                e.target.value
              )
            }
            className="w-full p-3 rounded-xl bg-zinc-800 text-white"
          >
            {categories.map(
              (cat) => (
                <option
                  key={cat}
                  value={cat}
                >
                  {cat}
                </option>
              )
            )}
          </select>

          <button
            type="submit"
            className="bg-green-500 hover:bg-green-600 px-5 py-3 rounded-xl font-bold"
          >
            Add Transaction
          </button>
        </form>

        {/* TRANSACTIONS */}

        <div className="space-y-4">
          {transactions.map(
            (
              transaction
            ) => (
              <div
                key={
                  transaction._id
                }
                className="bg-zinc-900 p-4 rounded-xl"
              >
                {editingId ===
                transaction._id ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={
                        editTitle
                      }
                      onChange={(
                        e
                      ) =>
                        setEditTitle(
                          e.target
                            .value
                        )
                      }
                      className="w-full p-3 rounded-xl bg-zinc-800 text-white"
                    />

                    <input
                      type="number"
                      value={
                        editAmount
                      }
                      onChange={(
                        e
                      ) =>
                        setEditAmount(
                          e.target
                            .value
                        )
                      }
                      className="w-full p-3 rounded-xl bg-zinc-800 text-white"
                    />

                    <select
                      value={
                        editCategory
                      }
                      onChange={(
                        e
                      ) =>
                        setEditCategory(
                          e.target
                            .value
                        )
                      }
                      className="w-full p-3 rounded-xl bg-zinc-800 text-white"
                    >
                      {categories.map(
                        (
                          cat
                        ) => (
                          <option
                            key={
                              cat
                            }
                            value={
                              cat
                            }
                          >
                            {cat}
                          </option>
                        )
                      )}
                    </select>

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
                        onClick={() =>
                          setEditingId(
                            null
                          )
                        }
                        className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="font-semibold text-lg">
                        {
                          transaction.title
                        }
                      </h2>

                      <p className="text-zinc-400 text-sm">
                        {
                          transaction.category
                        }
                      </p>

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
      </div>
    </MainLayout>
  );
}

export default Transactions;