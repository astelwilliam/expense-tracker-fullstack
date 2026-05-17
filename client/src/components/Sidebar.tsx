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
      icon: (
        <LayoutDashboard size={18} />
      ),
      protected: true,
    },
    {
      name: "Transactions",
      path: "/transactions",
      icon: <Receipt size={18} />,
      protected: true,
    },
    {
      name: "Analytics",
      path: "/analytics",
      icon: (
        <BarChart3 size={18} />
      ),
      protected: true,
    },
    {
      name: "Login",
      path: "/login",
      icon: <LogIn size={18} />,
      protected: false,
    },
    {
      name: "Signup",
      path: "/signup",
      icon: <UserPlus size={18} />,
      protected: false,
    },
  ];

  return (
    <div className="w-full lg:w-64 bg-zinc-950 border-b lg:border-b-0 lg:border-r border-zinc-800">
      <div className="p-4">
        {/* TITLE */}

        <h1 className="text-2xl font-bold mb-4 text-center lg:text-left">
          Expense Tracker
        </h1>

        {/* NAV */}

        <nav className="flex flex-wrap lg:flex-col gap-2">
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
                className={`flex items-center justify-center lg:justify-start gap-2 px-4 py-3 rounded-xl transition min-w-fit ${
                  location.pathname ===
                  item.path
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                }`}
              >
                {item.icon}

                <span className="text-sm">
                  {item.name}
                </span>
              </Link>
            ))}
        </nav>

        {/* LOGOUT */}

        {authenticated && (
          <button
            onClick={handleLogout}
            className="w-full mt-4 bg-red-500 hover:bg-red-600 px-4 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2"
          >
            <LogOut size={18} />

            Logout
          </button>
        )}
      </div>
    </div>
  );
}

export default Sidebar;