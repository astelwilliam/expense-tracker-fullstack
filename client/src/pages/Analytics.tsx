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
  category?: string;
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

  /* INCOME */

  const income = transactions
    .filter((t) => t.amount > 0)
    .reduce(
      (acc, t) => acc + t.amount,
      0
    );

  /* EXPENSES */

  const expenses = transactions
    .filter((t) => t.amount < 0)
    .reduce(
      (acc, t) =>
        acc + Math.abs(t.amount),
      0
    );

  /* PIE DATA */

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

  /* BAR DATA */

  const barData = transactions.map(
    (transaction) => ({
      name: transaction.title,
      amount: transaction.amount,
    })
  );

  /* CATEGORY ANALYTICS */

  const expenseTransactions =
    transactions.filter(
      (transaction) =>
        transaction.amount < 0
    );

  const categoryTotals: {
    [key: string]: number;
  } = {};

  expenseTransactions.forEach(
    (transaction) => {
      const category =
        transaction.category ||
        "Other";

      categoryTotals[category] =
        (categoryTotals[
          category
        ] || 0) +
        Math.abs(
          transaction.amount
        );
    }
  );

  const categoryData =
    Object.keys(categoryTotals).map(
      (category) => ({
        name: category,
        value:
          categoryTotals[
            category
          ],
      })
    );

  return (
    <MainLayout>
      <h1 className="text-3xl md:text-4xl font-bold mb-8">
        Analytics
      </h1>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* INCOME VS EXPENSES */}

        <div className="bg-zinc-900 p-4 md:p-6 rounded-2xl min-h-[400px]">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
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
                outerRadius={100}
                label
              >
                {pieData.map(
                  (
                    entry,
                    index
                  ) => (
                    <Cell
                      key={index}
                      fill={
                        COLORS[
                          index
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

        {/* CATEGORY PIE CHART */}

        <div className="bg-zinc-900 p-4 md:p-6 rounded-2xl min-h-[400px]">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            Expenses by Category
          </h2>

          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label
              >
                {categoryData.map(
                  (
                    entry,
                    index
                  ) => (
                    <Cell
                      key={index}
                      fill={
                        [
                          "#ef4444",
                          "#f97316",
                          "#eab308",
                          "#22c55e",
                          "#3b82f6",
                          "#a855f7",
                          "#ec4899",
                        ][
                          index % 7
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

        {/* TRANSACTIONS OVERVIEW */}

        <div className="bg-zinc-900 p-4 md:p-6 rounded-2xl min-h-[400px] xl:col-span-2">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
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