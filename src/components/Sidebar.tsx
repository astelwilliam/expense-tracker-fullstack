import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  LogIn,
  UserPlus,
} from "lucide-react";

function Sidebar() {
  return (
    <div className="w-64 min-h-screen bg-zinc-950 border-r border-zinc-800 p-5">
      <h1 className="text-2xl font-bold text-white mb-10">
        Expense Tracker
      </h1>

      <nav className="flex flex-col gap-4">
        <Link
          to="/"
          className="flex items-center gap-3 text-zinc-300 hover:text-white"
        >
          <LayoutDashboard size={20} />
          Dashboard
        </Link>

        <Link
          to="/transactions"
          className="flex items-center gap-3 text-zinc-300 hover:text-white"
        >
          <Receipt size={20} />
          Transactions
        </Link>

        <Link
          to="/analytics"
          className="flex items-center gap-3 text-zinc-300 hover:text-white"
        >
          <BarChart3 size={20} />
          Analytics
        </Link>

        <Link
          to="/login"
          className="flex items-center gap-3 text-zinc-300 hover:text-white"
        >
          <LogIn size={20} />
          Login
        </Link>

        <Link
          to="/signup"
          className="flex items-center gap-3 text-zinc-300 hover:text-white"
        >
          <UserPlus size={20} />
          Signup
        </Link>
      </nav>
    </div>
  );
}

export default Sidebar;