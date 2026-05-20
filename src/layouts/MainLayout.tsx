import React from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({
  children,
}: MainLayoutProps) => {
  const navigate =
    useNavigate();

  const handleLogout = () => {
    localStorage.removeItem(
      "token"
    );

    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      {/* Sidebar */}

      <aside className="w-64 bg-zinc-900 p-6 hidden md:block">
        <h1 className="text-2xl font-bold mb-10">
          Expense Tracker
        </h1>

        <nav className="flex flex-col gap-4">
          <Link
            to="/dashboard"
            className="hover:text-blue-400"
          >
            Dashboard
          </Link>

          <Link
            to="/analytics"
            className="hover:text-blue-400"
          >
            Analytics
          </Link>

          <button
            onClick={handleLogout}
            className="text-left text-red-400 hover:text-red-500"
          >
            Logout
          </button>
        </nav>
      </aside>

      {/* Content */}

      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;