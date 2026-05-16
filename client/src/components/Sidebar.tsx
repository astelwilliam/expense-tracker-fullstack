import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  LogIn,
  UserPlus,
  LogOut,
} from "lucide-react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  logout,
  isAuthenticated,
} from "../utils/auth";

function Sidebar() {
  const location = useLocation();

  const navigate = useNavigate();

  const authenticated =
    isAuthenticated();

  const handleLogout = () => {
    logout();

    navigate("/login");
  };

  const navItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: <LayoutDashboard size={20} />,
      protected: true,
    },
    {
      name: "Transactions",
      path: "/transactions",
      icon: <Receipt size={20} />,
      protected: true,
    },
    {
      name: "Analytics",
      path: "/analytics",
      icon: <BarChart3 size={20} />,
      protected: true,
    },
    {
      name: "Login",
      path: "/login",
      icon: <LogIn size={20} />,
      protected: false,
    },
    {
      name: "Signup",
      path: "/signup",
      icon: <UserPlus size={20} />,
      protected: false,
    },
  ];

  return (
    <div className="w-64 h-screen bg-zinc-950 border-r border-zinc-800 p-6 flex flex-col justify-between">
      <div>
        <h1 className="text-3xl font-bold mb-10">
          Expense Tracker
        </h1>

        <nav className="space-y-3">
          {navItems
            .filter((item) =>
              authenticated
                ? item.protected
                : !item.protected
            )
            .map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  location.pathname ===
                  item.path
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                }`}
              >
                {item.icon}

                <span>{item.name}</span>
              </Link>
            ))}
        </nav>
      </div>

      {authenticated && (
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 px-4 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2"
        >
          <LogOut size={18} />

          Logout
        </button>
      )}
    </div>
  );
}

export default Sidebar;