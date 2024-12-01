import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";
import TeamList from "./teams/TeamList";
import TeamDetails from "./teams/TeamDetails";

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
      {/* Navigation */}
      <nav className="bg-[#0D1425] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-lg font-bold text-white">C</span>
              </div>
              <span className="text-xl font-bold text-white">CollabHub</span>
            </motion.div>

            <div className="flex items-center gap-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-gray-300"
              >
                {user?.name || user?.username}
              </motion.div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-all"
              >
                Logout
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user?.name || user?.username}
          </h1>
          <p className="text-gray-400">
            Here's what's happening with your team today.
          </p>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative group cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative p-6 bg-[#0D1425] border border-white/10 rounded-xl hover:border-white/20 transition-all">
                <span className="text-2xl mb-3 block">{action.icon}</span>
                <h3 className="text-white font-medium mb-1">{action.label}</h3>
                <p className="text-gray-400 text-sm">{action.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Teams Section */}
        <div className="mb-8">
          <TeamList onTeamClick={handleTeamClick} />
        </div>

        {/* Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            <div className="bg-[#0D1425] rounded-xl border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Recent Activity
              </h2>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <motion.div
                    key={activity.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="flex items-start gap-4 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <span className="text-2xl">{activity.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-white font-medium">
                          {activity.title}
                        </h3>
                        <span className="text-gray-400 text-sm">
                          {activity.time}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">{activity.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* AI Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-[#0D1425] rounded-xl border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                AI Insights
              </h2>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🤖</span>
                    <h3 className="text-white font-medium">Team Performance</h3>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Task completion rate is up 15% this week. Great progress!
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">📈</span>
                    <h3 className="text-white font-medium">
                      Productivity Tips
                    </h3>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Consider scheduling team sync at 10 AM for optimal
                    engagement.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Render TeamDetails modal when a team is selected */}
        {selectedTeam && (
          <TeamDetails
            team={selectedTeam}
            onClose={() => setSelectedTeam(null)}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
