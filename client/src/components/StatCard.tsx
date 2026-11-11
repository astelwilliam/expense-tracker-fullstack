interface StatCardProps {
  title: string;
  amount: string;
  color?: string;
}

function StatCard({
  title,
  amount,
  color = "text-white",
}: StatCardProps) {
  return (
    <div className="fin-card p-5 md:p-6 rounded-2xl transition duration-200 hover:-translate-y-0.5">
      <h2 className="text-zinc-400 text-sm mb-3">
        {title}
      </h2>

      <p className={`text-2xl md:text-3xl font-bold tracking-tight ${color}`}>
        {amount}
      </p>
    </div>
  );
}

export default StatCard;
