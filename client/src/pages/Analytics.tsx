import {
  useEffect,
  useState,
} from "react";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Bar,
} from "recharts";

import MainLayout from "../layouts/MainLayout";

import api from "../services/api";

interface Transaction {
  _id: string;
  title: string;
  amount: number;
}

function Analytics() {
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
    .filter((t) => t.amount > 0)
    .reduce(
      (acc, t) => acc + t.amount,
      0
    );

  const expenses = transactions
    .filter((t) => t.amount < 0)
    .reduce(
      (acc, t) => acc + Math.abs(t.amount),
      0
    );

  const pieData = [
    {
      name: "Income",
      value: income,
    },
    {
      name: "Expenses",
      value: expenses,
    },
  ];

  const COLORS = [
    "#22c55e",
    "#ef4444",
  ];

  const barData = transactions.map(
    (transaction) => ({
      name: transaction.title,
      amount: transaction.amount,
    })
  );

  return (
    <MainLayout>
      <h1 className="text-4xl font-bold mb-8">
        Analytics
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* PIE CHART */}

        <div className="bg-zinc-900 p-6 rounded-2xl min-h-[400px]">
          <h2 className="text-2xl font-bold mb-4">
            Income vs Expenses
          </h2>

          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={120}
                label
              >
                {pieData.map(
                  (entry, index) => (
                    <Cell
                      key={index}
                      fill={
                        COLORS[index]
                      }
                    />
                  )
                )}
              </Pie>

              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* BAR CHART */}

        <div className="bg-zinc-900 p-6 rounded-2xl min-h-[400px]">
          <h2 className="text-2xl font-bold mb-4">
            Transactions Overview
          </h2>

          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <BarChart data={barData}>
              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis dataKey="name" />

              <YAxis />

              <Tooltip />

              <Bar
                dataKey="amount"
                fill="#3b82f6"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </MainLayout>
  );
}

export default Analytics;