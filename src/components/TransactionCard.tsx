interface TransactionCardProps {
  id: number;
  title: string;
  amount: number;
  onDelete: (id: number) => void;
}

function TransactionCard({
  id,
  title,
  amount,
  onDelete,
}: TransactionCardProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition p-5 rounded-2xl flex justify-between items-center">
      <div>
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

      <button
        onClick={() => onDelete(id)}
        className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl text-white transition"
      >
        Delete
      </button>
    </div>
  );
}

export default TransactionCard;