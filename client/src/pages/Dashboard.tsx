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

      console.log(response.data);
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
      <h1 className="text-4xl font-bold mb-6">
        Dashboard
      </h1>

      <div className="grid grid-cols-3 gap-6 mb-10">
        <StatCard
          title="Total Balance"
          amount={`₹${balance}`}
        />

        <StatCard
          title="Income"
          amount={`₹${income}`}
          color="text-green-500"
        />

        <StatCard
          title="Expenses"
          amount={`₹${Math.abs(expenses)}`}
          color="text-red-500"
        />
      </div>

      <div className="bg-zinc-900 p-6 rounded-2xl">
        <h2 className="text-2xl font-bold mb-5">
          Recent Transactions
        </h2>

        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction._id}
              className="flex justify-between border-b border-zinc-800 pb-3"
            >
              <span>{transaction.title}</span>

              <span
                className={
                  transaction.amount > 0
                    ? "text-green-500"
                    : "text-red-500"
                }
              >
                {transaction.amount > 0
                  ? "+"
                  : "-"}{" "}
                ₹
                {Math.abs(
                  transaction.amount
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

export default Dashboard;