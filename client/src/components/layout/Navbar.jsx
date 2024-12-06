import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Users2, LayoutDashboard, Settings, LogOut } from "lucide-react";

const Navbar = () => {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user"));

  const navItems = [
    { path: "/dashboard", icon: Home, label: "Home" },
    { path: "/teams", icon: Users2, label: "Teams" },
    { path: "/projects", icon: LayoutDashboard, label: "Projects" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <header className="bg-[#0D1425] border-b border-white/10">
      <div className="w-full px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="relative w-9 h-9">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl animate-pulse-slow" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-xl animate-blob" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              TeamFlow
            </span>
          </Link>

          <div className="flex items-center gap-8">
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="relative px-4 py-2 group"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="navbar-active"
                        className="absolute inset-0 bg-white/5 rounded-lg"
                        transition={{
                          type: "spring",
                          bounce: 0.2,
                          duration: 0.6,
                        }}
                      />
                    )}
                    <span
                      className={`relative flex items-center gap-2 ${
                        isActive ? "text-white" : "text-gray-400"
                      } group-hover:text-white transition-colors`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-6 border-l border-white/10 pl-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                  <div className="relative w-9 h-9 bg-[#0D1425] ring-1 ring-white/10 rounded-xl flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 via-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 opacity-0 group-hover:opacity-20 animate-gradient-x" />
                    <span className="relative text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200">
                      {user?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-white group-hover:text-blue-200 transition-colors">
                    {user?.username}
                  </p>
                  <p className="text-gray-400 text-xs">{user?.email}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
