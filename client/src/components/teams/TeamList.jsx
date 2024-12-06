import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../utils/api";
import { getSocket, initializeSocket } from "../../utils/socket";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  Users2,
  Plus,
  Loader2,
  AlertCircle,
  Calendar,
  MessageSquare,
  BarChart3,
  ChevronRight,
} from "lucide-react";

const TeamList = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTeams = async () => {
    try {
      const response = await api.get("/teams");
      setTeams(response.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching teams:", err);
      setError(err.message);
      toast.error(err.message || "Failed to load teams");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      console.log("[TeamList] No socket available");
      return;
    }

    const handleTeamEvent = async (data) => {
      console.log("[TeamList] Team event received:", data);
      const currentUserId = JSON.parse(localStorage.getItem("user"))?.id;
      if (!currentUserId) return;

      try {
        if (data.type === "MEMBER_ADDED") {
          if (data.isAdmin) {
            toast.success(
              `Successfully added member to team: ${data.teamName}`
            );
            setTeams((prevTeams) =>
              prevTeams.map((team) =>
                team.id === data.teamId
                  ? { ...team, memberCount: data.memberCount }
                  : team
              )
            );
          } else if (currentUserId === data.userId) {
            toast.success(`You've been added to team: ${data.teamName}`);
            const response = await api.get("/teams");
            setTeams(response.data || []);
          }
        } else if (data.type === "MEMBER_REMOVED") {
          if (data.isAdmin) {
            toast.success("Member removed successfully");
            setTeams((prevTeams) =>
              prevTeams.map((team) =>
                team.id === data.teamId
                  ? { ...team, memberCount: data.memberCount }
                  : team
              )
            );
          } else if (currentUserId === data.userId) {
            toast.error(`You've been removed from team: ${data.teamName}`);
            setTeams((prevTeams) =>
              prevTeams.filter((team) => team.id !== data.teamId)
            );
          }
        }
      } catch (err) {
        console.error("[TeamList] Error handling team event:", err);
      }
    };

    socket.on("teamEvent", handleTeamEvent);

    return () => {
      socket.off("teamEvent", handleTeamEvent);
    };
  }, []);

  const handleTeamClick = (team) => {
    navigate(`/teams/${team.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-gray-400">Loading teams...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 p-6">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-red-400 text-center max-w-md">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users2 className="w-6 h-6" />
            Teams
          </h1>
          <p className="text-gray-400">
            Manage and collaborate with your teams
          </p>
        </div>
        <button
          onClick={() => navigate("/teams/new")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Team
        </button>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {teams.map((team) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group cursor-pointer"
              onClick={() => handleTeamClick(team)}
            >
              <div className="relative h-full rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 hover:border-blue-500/50 p-6 transition-all duration-300">
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300" />

                <div className="relative space-y-6">
                  {/* Team Header */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {team.name}
                      </h3>
                      <p className="text-sm text-gray-400 line-clamp-2">
                        {team.description || "No description provided"}
                      </p>
                    </div>
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                      {team.userRole}
                    </span>
                  </div>

                  {/* Team Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        {new Date(team.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-sm">
                        {team.memberCount || 0} members
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <BarChart3 className="w-4 h-4" />
                      <span className="text-sm">
                        {team.projectCount || 0} projects
                      </span>
                    </div>
                  </div>

                  {/* View Details Button */}
                  <div className="flex justify-end">
                    <button className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                      View Details
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TeamList;
