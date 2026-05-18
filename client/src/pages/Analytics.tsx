import React from "react";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import { useTransactions } from "../context/TransactionContext";

const COLORS = [
  "#22c55e",
  "#ef4444",
  "#3b82f6",
  "#eab308",
  "#a855f7",
  "#f97316",
];

function Analytics() {
  const { transactions } =
    useTransactions();

  const income = transactions
    .filter(
      (transaction) =>
        transaction.amount > 0
    )
    .reduce(
      (acc, transaction) =>
        acc + transaction.amount,
      0
    );

  const expenses = transactions
    .filter(
      (transaction) =>
        transaction.amount < 0
    )
    .reduce(
      (acc, transaction) =>
        acc + Math.abs(transaction.amount),
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

  const categoryTotals:
    Record<string, number> = {};

  transactions
    .filter(
      (transaction) =>
        transaction.amount < 0
    )
    .forEach((transaction) => {
      const category =
        transaction.category ||
        "Other";

      if (
        categoryTotals[category]
      ) {
        categoryTotals[
          category
        ] += Math.abs(
          transaction.amount
        );
      } else {
        categoryTotals[
          category
        ] = Math.abs(
          transaction.amount
        );
      }
    });

  const categoryData =
    Object.entries(
      categoryTotals
    ).map(
      ([category, amount]) => ({
        name: category,
        value: amount,
      })
    );

  return (
    <div className="p-6 text-white">
      <h1 className="text-4xl font-bold mb-8">
        Analytics
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses */}

        <div className="bg-zinc-900 rounded-2xl p-6 shadow-lg h-[400px]">
          <h2 className="text-2xl font-bold mb-6">
            Income vs Expenses
          </h2>

          <ResponsiveContainer
            width="100%"
            height="85%"
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
                  (
                    _entry,
                    index
                  ) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        COLORS[
                          index %
                            COLORS.length
                        ]
                      }
                    />
                  )
                )}
              </Pie>

              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Expenses by Category */}

        <div className="bg-zinc-900 rounded-2xl p-6 shadow-lg h-[400px]">
          <h2 className="text-2xl font-bold mb-6">
            Expenses by Category
          </h2>

          {categoryData.length ===
          0 ? (
            <div className="flex items-center justify-center h-[300px] text-zinc-400">
              No expense categories yet
            </div>
          ) : (
            <ResponsiveContainer
              width="100%"
              height="85%"
            >
              <PieChart>
                <Pie
                  data={
                    categoryData
                  }
                  dataKey="value"
                  nameKey="name"
                  outerRadius={120}
                  label
                >
                  {categoryData.map(
                    (
                      _entry,
                      index
                    ) => (
                      <Cell
                        key={`category-cell-${index}`}
                        fill={
                          COLORS[
                            index %
                              COLORS.length
                          ]
                        }
                      />
                    )
                  )}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Transactions Overview */}

        <div className="bg-zinc-900 rounded-2xl p-6 shadow-lg h-[400px] lg:col-span-2">
          <h2 className="text-2xl font-bold mb-6">
            Transactions Overview
          </h2>

          <ResponsiveContainer
            width="100%"
            height="85%"
          >
            <BarChart
              data={transactions}
            >
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                dataKey="title"
              />

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
    </div>
  );
}

export default Analytics;