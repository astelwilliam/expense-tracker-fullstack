import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  UploadCloud,
  Sparkles,
  LogIn,
  UserPlus,
  LogOut,
  WalletCards,
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
    { name: "Smart Import", path: "/smart-import", icon: <UploadCloud size={18} />, protected: true },
    { name: "Smart Assist", path: "/smart-assist", icon: <Sparkles size={18} />, protected: true },
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
    <aside className="w-full lg:w-72 lg:min-h-screen lg:sticky lg:top-0 bg-[#091310]/85 backdrop-blur-xl border-b lg:border-b-0 lg:border-r border-emerald-100/10">
      <div className="p-4 lg:p-6">
        {/* TITLE */}

        <div className="flex items-center gap-3 mb-7"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400 text-[#062019]"><WalletCards size={21}/></span><div><h1 className="font-bold tracking-tight">Finora</h1><p className="text-xs text-zinc-500">Personal finance</p></div></div>

        {/* NAV */}

        <nav className="flex overflow-x-auto lg:flex-col gap-2" aria-label="Primary navigation">
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
                    ? "bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-300/20"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
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
            className="w-full mt-6 border border-rose-300/15 text-rose-200 hover:bg-rose-400/10 px-4 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2"
          >
            <LogOut size={18} />

            Logout
          </button>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
