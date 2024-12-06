import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";
import TeamList from "./teams/TeamList";
import TeamDetails from "./teams/TeamDetails";
import { Users2, Plus } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [selectedTeam, setSelectedTeam] = useState(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleTeamClick = (team) => {
    setSelectedTeam(team);
  };

  if (!isAuthenticated()) return null;

  const quickActions = [
    { icon: "📅", label: "Schedule Meeting", desc: "Set up team sync" },
    { icon: "✅", label: "Create Task", desc: "Add new project task" },
    { icon: "👥", label: "Invite Team", desc: "Grow your team" },
    { icon: "📊", label: "View Reports", desc: "Check team metrics" },
  ];

  const recentActivities = [
    {
      type: "meeting",
      title: "Team Sync",
      time: "2 hours ago",
      desc: "AI generated 5 action items",
      icon: "🎯",
    },
    {
      type: "task",
      title: "Project Milestone",
      time: "4 hours ago",
      desc: "3 tasks completed",
      icon: "📋",
    },
    {
      type: "chat",
      title: "Team Discussion",
      time: "6 hours ago",
      desc: "15 new messages",
      icon: "💬",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0F1C]">
      <main className="w-full px-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user?.name || user?.username}
          </h1>
          <p className="text-gray-400">
            Here's what's happening with your team today.
          </p>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative group cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-6 bg-[#0D1425] border border-white/10 rounded-xl hover:border-white/20 transition-all">
                <span className="text-2xl mb-4 block">{action.icon}</span>
                <h3 className="text-white font-medium mb-2">{action.label}</h3>
                <p className="text-gray-400 text-sm">{action.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Teams Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Users2 className="w-5 h-5 text-white" />
              <h2 className="text-xl font-semibold text-white">Teams</h2>
            </div>
            <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Team
            </button>
          </div>
          <TeamList onTeamClick={handleTeamClick} />
        </div>

        {/* Activity Feed and Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rest of your activity feed code... */}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
