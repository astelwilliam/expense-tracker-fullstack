import MainLayout from "../layouts/MainLayout";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { useTransactions } from "../context/TransactionContext";

function Analytics() {
  const { transactions } =
    useTransactions();

  const income = transactions
    .filter((transaction) => transaction.amount > 0)
    .reduce(
      (total, transaction) =>
        total + transaction.amount,
      0
    );

  const expenses = transactions
    .filter((transaction) => transaction.amount < 0)
    .reduce(
      (total, transaction) =>
        total + Math.abs(transaction.amount),
      0
    );

  const data = [
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

  return (
    <MainLayout>
      <h1 className="text-4xl font-bold mb-8">
        Analytics
      </h1>

      <div className="grid grid-cols-2 gap-8">
        <div className="bg-zinc-900 p-6 rounded-2xl h-[400px]">
          <h2 className="text-2xl font-bold mb-6">
            Income vs Expenses
          </h2>

          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                outerRadius={120}
                label
              >
                {data.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[index]}
                  />
                ))}
              </Pie>

              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-zinc-900 p-6 rounded-2xl">
          <h2 className="text-2xl font-bold mb-6">
            Summary
          </h2>

          <div className="space-y-6">
            <div>
              <p className="text-zinc-400">
                Total Income
              </p>

              <h3 className="text-3xl font-bold text-green-500">
                ₹{income}
              </h3>
            </div>

            <div>
              <p className="text-zinc-400">
                Total Expenses
              </p>

              <h3 className="text-3xl font-bold text-red-500">
                ₹{expenses}
              </h3>
            </div>

            <div>
              <p className="text-zinc-400">
                Net Balance
              </p>

              <h3 className="text-3xl font-bold">
                ₹{income - expenses}
              </h3>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default Analytics;