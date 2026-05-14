interface TransactionCardProps {
  title: string;
  amount: number;
}

function TransactionCard({
  title,
  amount,
}: TransactionCardProps) {
  return (
    <div className="bg-zinc-900 p-5 rounded-2xl flex justify-between items-center">
      <h2 className="text-lg font-medium">
        {title}
      </h2>

      <p
        className={`text-lg font-bold ${
          amount > 0
            ? "text-green-500"
            : "text-red-500"
        }`}
      >
        {amount > 0 ? "+" : "-"} ₹
        {Math.abs(amount)}
      </p>
    </div>
  );
}

export default TransactionCard;