import { ArrowDownRight, ArrowUpRight, Plus, UploadCloud } from "lucide-react";
import { Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import StatCard from "../components/StatCard";
import { useTransactions } from "../context/TransactionContext";
import { dateOf, formatINR, summarize, todayLocal } from "../utils/transactions";

function Dashboard() {
  const { transactions, loading, error, fetchTransactions } = useTransactions();

  const overall = summarize(transactions);
  const currentMonth = todayLocal().slice(0, 7);
  const monthly = summarize(transactions.filter((transaction) => dateOf(transaction).startsWith(currentMonth)));
  const monthLabel = new Date().toLocaleString("en-IN", { month: "long", year: "numeric" });

  return (
    <MainLayout>
      <div className="w-full max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-end sm:justify-between mb-7"><div><p className="text-emerald-300 text-sm font-semibold">OVERVIEW</p><h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-1">Your money, clearly.</h1><p className="text-zinc-400 mt-2">A focused view of {monthLabel}.</p></div><div className="flex gap-2"><Link to="/transactions" className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 font-semibold text-[#062019] hover:bg-emerald-300"><Plus size={18}/>Add transaction</Link><Link to="/smart-import" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10"><UploadCloud size={18}/>Import</Link></div></div>
        {error && <div className="mb-4 text-red-400" role="alert">{error} <button className="underline" onClick={() => void fetchTransactions().catch(() => {})}>Retry</button></div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5 mb-8 w-full">
          <div className="min-w-0"><StatCard title="Total Balance" amount={formatINR(overall.balance)} /></div>
          <div className="min-w-0"><StatCard title="Income" amount={formatINR(overall.income)} color="text-green-500" /></div>
          <div className="min-w-0"><StatCard title="Expenses" amount={formatINR(overall.expenses)} color="text-red-500" /></div>
        </div>
        <section className="mb-8 fin-card rounded-2xl p-5 md:p-6">
          <div className="flex items-center justify-between mb-4"><div><p className="text-sm text-zinc-400">This month</p><h2 className="text-xl font-bold">Cash flow</h2></div><span className="text-sm text-emerald-300">{monthly.balance >= 0 ? "On track" : "Review spending"}</span></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Monthly Income" amount={formatINR(monthly.income)} color="text-green-500" />
            <StatCard title="Monthly Expenses" amount={formatINR(monthly.expenses)} color="text-red-500" />
            <StatCard title="Monthly Net" amount={formatINR(monthly.balance)} />
          </div>
        </section>
        <div className="fin-card p-4 md:p-6 rounded-2xl w-full overflow-hidden">
          <div className="flex justify-between items-center mb-5"><h2 className="text-xl font-bold">Recent activity</h2><Link to="/transactions" className="text-sm text-emerald-300 hover:text-emerald-200">View all</Link></div>
          {loading && <p className="text-zinc-400">Loading transactions...</p>}
          {!loading && !error && transactions.length === 0 && <p className="text-zinc-400">No transactions yet.</p>}
          <div className="space-y-4">
            {transactions.slice(0, 10).map((transaction) => (
              <div key={transaction._id} className="flex items-center justify-between gap-4 border-b border-white/5 py-3 last:border-0">
                <div className="min-w-0"><span className="block truncate font-medium">{transaction.title}</span><span className="text-xs text-zinc-500">{transaction.category} · {dateOf(transaction)}</span></div>
                <span className={`inline-flex items-center gap-1 font-semibold whitespace-nowrap text-sm ${transaction.amount > 0 ? "text-emerald-300" : "text-rose-300"}`}>
                  {transaction.amount > 0 ? <ArrowUpRight size={15}/> : <ArrowDownRight size={15}/>} {formatINR(Math.abs(transaction.amount))}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default Dashboard;
