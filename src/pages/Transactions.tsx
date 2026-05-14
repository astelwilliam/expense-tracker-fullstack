import MainLayout from "../layouts/MainLayout";
import TransactionCard from "../components/TransactionCard";
import { transactions } from "../data/transactions";

function Transactions() {
  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">
          Transactions
        </h1>

        <button className="bg-white text-black px-5 py-2 rounded-xl font-medium hover:bg-zinc-200 transition">
          Add Transaction
        </button>
      </div>

      <div className="space-y-4">
        {transactions.map((transaction) => (
          <TransactionCard
            key={transaction.id}
            title={transaction.title}
            amount={transaction.amount}
          />
        ))}
      </div>
    </MainLayout>
  );
}

export default Transactions;