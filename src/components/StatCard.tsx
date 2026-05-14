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
    <div className="bg-zinc-900 p-6 rounded-2xl">
      <h2 className="text-zinc-400 mb-2">
        {title}
      </h2>

      <p className={`text-3xl font-bold ${color}`}>
        {amount}
      </p>
    </div>
  );
}

export default StatCard;