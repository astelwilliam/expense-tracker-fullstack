import { useEffect, useState } from "react";

import MainLayout from "../layouts/MainLayout";
import StatCard from "../components/StatCard";

import api from "../services/api";

interface Transaction {
  _id: string;
  title: string;
  amount: number;
}

function Dashboard() {
  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  useEffect(() => {
    fetchTransactions();
  }, []);

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

  const income = transactions
    .filter(
      (transaction) =>
        transaction.amount > 0
    )
    .reduce(
      (total, transaction) =>
        total + transaction.amount,
      0
    );

  const expenses = transactions
    .filter(
      (transaction) =>
        transaction.amount < 0
    )
    .reduce(
      (total, transaction) =>
        total + transaction.amount,
      0
    );

  const balance = income + expenses;

  return (
    <MainLayout>
      <div className="w-full max-w-full overflow-hidden">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 break-words">
          Dashboard
        </h1>

        {/* STATS */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 mb-8 w-full">
          <div className="min-w-0">
            <StatCard
              title="Total Balance"
              amount={`₹${balance}`}
            />
          </div>

          <div className="min-w-0">
            <StatCard
              title="Income"
              amount={`₹${income}`}
              color="text-green-500"
            />
          </div>

          <div className="min-w-0">
            <StatCard
              title="Expenses"
              amount={`₹${Math.abs(
                expenses
              )}`}
              color="text-red-500"
            />
          </div>
        </div>

        {/* RECENT TRANSACTIONS */}

        <div className="bg-zinc-900 p-4 md:p-6 rounded-2xl w-full overflow-hidden">
          <h2 className="text-xl md:text-2xl font-bold mb-5">
            Recent Transactions
          </h2>

          <div className="space-y-4">
            {transactions.map(
              (transaction) => (
                <div
                  key={transaction._id}
                  className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-3"
                >
                  <span className="truncate">
                    {transaction.title}
                  </span>

                  <span
                    className={`font-semibold whitespace-nowrap text-sm md:text-base ${
                      transaction.amount >
                      0
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {transaction.amount >
                    0
                      ? "+"
                      : "-"}{" "}
                    ₹
                    {Math.abs(
                      transaction.amount
                    )}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default Dashboard;