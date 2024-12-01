import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import api from "../utils/api";
import { isAuthenticated } from "../utils/auth";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post("/users/register", formData);
      navigate("/login");
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: "🎯",
      title: "Task Management",
      desc: "Organize and track team progress",
    },
    {
      icon: "🧠",
      title: "AI Assistant",
      desc: "Get smart task recommendations",
    },
    {
      icon: "📈",
      title: "Performance Insights",
      desc: "Track team productivity",
    },
    {
      icon: "🤝",
      title: "Team Collaboration",
      desc: "Work together seamlessly",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0F1C] flex">
      {/* Left side - Features Preview */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] bg-[#0D1425] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#1a1f47,transparent_50%)]"></div>
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px]"></div>

        <div className="relative flex flex-col items-center justify-center w-full p-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-4xl font-bold text-white">
              Join CollabHub Today
            </h2>
            <p className="text-lg text-gray-400">
              Experience the future of team collaboration
            </p>
          </motion.div>

          <div className="grid w-full max-w-3xl grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="relative group"
              >
                <div className="absolute inset-0 transition-opacity bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl group-hover:opacity-100"></div>
                <div className="relative p-6 transition-colors border bg-white/5 border-white/10 rounded-2xl hover:border-white/20">
                  <span className="block mb-4 text-3xl">{feature.icon}</span>
                  <h3 className="mb-2 font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-400">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-[45%] xl:w-[40%] relative flex items-center justify-center p-8">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-3xl"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,#1D2B4C,transparent_50%)]"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="mb-10">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-3 mb-6"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-500">
                <span className="text-xl font-bold text-white">C</span>
              </div>
              <span className="text-2xl font-bold text-white">CollabHub</span>
            </motion.div>
            <h2 className="mb-2 text-3xl font-bold text-white">
              Create Account
            </h2>
            <p className="text-gray-400">Start your collaboration journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 border bg-red-500/10 border-red-500/20 rounded-xl"
                >
                  <p className="text-sm text-center text-red-400">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Username
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 transition-opacity bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur-md opacity-20 group-hover:opacity-30"></div>
                  <input
                    type="text"
                    required
                    className="relative w-full px-4 py-3 text-white placeholder-gray-500 transition-all border bg-white/5 border-white/10 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 transition-opacity bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur-md opacity-20 group-hover:opacity-30"></div>
                  <input
                    type="email"
                    required
                    className="relative w-full px-4 py-3 text-white placeholder-gray-500 transition-all border bg-white/5 border-white/10 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 transition-opacity bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur-md opacity-20 group-hover:opacity-30"></div>
                  <input
                    type="password"
                    required
                    className="relative w-full px-4 py-3 text-white placeholder-gray-500 transition-all border bg-white/5 border-white/10 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={isLoading}
              className={`relative w-full group ${
                isLoading ? "cursor-not-allowed" : ""
              }`}
            >
              <div className="absolute inset-0 transition-opacity opacity-75 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur-md group-hover:opacity-100"></div>
              <div
                className={`relative px-6 py-3 rounded-xl flex items-center justify-center font-medium text-white
                ${
                  isLoading
                    ? "bg-gray-600"
                    : "bg-gradient-to-r from-blue-500 to-purple-500"
                }`}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 rounded-full border-white/30 border-t-white animate-spin"></div>
                ) : (
                  "Create your account"
                )}
              </div>
            </motion.button>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
              >
                Already have an account?
                <span className="text-blue-400 hover:text-blue-300 group">
                  Sign in
                  <span className="block max-w-0 group-hover:max-w-full transition-all duration-200 h-0.5 bg-blue-400"></span>
                </span>
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
