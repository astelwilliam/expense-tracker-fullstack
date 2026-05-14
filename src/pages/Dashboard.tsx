import MainLayout from "../layouts/MainLayout";
import StatCard from "../components/StatCard";
import { transactions } from "../data/transactions";

function Dashboard() {
  return (
    <MainLayout>
      <h1 className="text-4xl font-bold mb-6">
        Dashboard
      </h1>

      <div className="grid grid-cols-3 gap-6 mb-10">
        <StatCard
          title="Total Balance"
          amount="₹25,000"
        />

        <StatCard
          title="Income"
          amount="₹40,000"
          color="text-green-500"
        />

        <StatCard
          title="Expenses"
          amount="₹15,000"
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
              key={transaction.id}
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
                {transaction.amount > 0 ? "+" : "-"} ₹
                {Math.abs(transaction.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

export default Dashboard;