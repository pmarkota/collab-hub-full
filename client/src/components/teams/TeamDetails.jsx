import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import api from "../../utils/api";
import { getSocket } from "../../utils/socket";
import TaskList from "../tasks/TaskList";
import CreateTaskModal from "../tasks/CreateTaskModal";
import TaskDetails from "../tasks/TaskDetails";

const TeamDetails = ({ team, onClose, onTeamUpdate }) => {
  const [activeTab, setActiveTab] = useState("members"); // "members" or "tasks"
  const [members, setMembers] = useState([]);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [memberCount, setMemberCount] = useState(team.memberCount || 0);

  useEffect(() => {
    fetchMembers();
  }, [team.id]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      console.log("[TeamDetails] No socket available");
      return;
    }

    const handleTeamEvent = (data) => {
      console.log("[TeamDetails] Team event received:", data);
      if (data.teamId === team.id) {
        setMemberCount(data.memberCount);
        fetchMembers(); // Refresh member list
      }
    };

    socket.on("teamEvent", handleTeamEvent);

    return () => {
      socket.off("teamEvent", handleTeamEvent);
    };
  }, [team.id]);

  const fetchMembers = async () => {
    try {
      const response = await api.get(`/teams/${team.id}/members`);
      setMembers(response.data || []);
    } catch (error) {
      toast.error("Failed to fetch members");
      console.error("Fetch members error:", error);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await api.get(`/tasks/team/${team.id}`);
      setTasks(response.data || []);
    } catch (error) {
      toast.error("Failed to load tasks");
      console.error("Fetch tasks error:", error);
    }
  };

  useEffect(() => {
    if (activeTab === "tasks") {
      fetchTasks();
    }
  }, [activeTab, team.id]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberEmail || isAddingMember) return;

    setIsAddingMember(true);
    try {
      await api.post(`/teams/${team.id}/members`, { email: newMemberEmail });
      setNewMemberEmail("");
    } catch (err) {
      toast.error(err.message || "Failed to add member");
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (isRemovingMember) return;

    setIsRemovingMember(true);
    try {
      await api.delete(`/teams/${team.id}/members/${memberId}`);
    } catch (err) {
      toast.error(err.message || "Failed to remove member");
    } finally {
      setIsRemovingMember(false);
    }
  };

  const handleTaskCreated = async (newTask) => {
    toast.success("Task created successfully");
    await fetchTasks();
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
  };

  const handleTaskUpdated = () => {
    // Refresh task list if needed
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="relative w-full max-w-4xl bg-[#0A0F1C] rounded-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-x" />
          <div className="relative p-6 bg-[#0A0F1C] m-[1px] rounded-t-2xl">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  {team.name}
                </h2>
                <p className="text-gray-400">{team.description}</p>
              </div>
              <motion.button
                whileHover={{ rotate: 90 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </motion.button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setActiveTab("members")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === "members"
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Members
              </button>
              <button
                onClick={() => setActiveTab("tasks")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === "tasks"
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Tasks
              </button>
            </div>
          </div>
        </div>

        {/* Content - Scrollable area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "members" ? (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10">
                  <div className="text-2xl font-bold text-white mb-1">
                    {memberCount}
                  </div>
                  <div className="text-gray-400">Team Members</div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-white/10">
                  <div className="text-2xl font-bold text-white mb-1">
                    {new Date(team.created_at).toLocaleDateString()}
                  </div>
                  <div className="text-gray-400">Created Date</div>
                </div>
              </div>

              {/* Members List */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Team Members
                </h3>
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {members.map((member, index) => (
                      <motion.div
                        key={member.users.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: index * 0.05 }}
                        className={`group relative overflow-hidden rounded-xl bg-white/5 border border-white/10 ${
                          member.role === "admin"
                            ? "hover:border-purple-500/50"
                            : "hover:border-blue-500/50"
                        } transition-all duration-300`}
                      >
                        {/* Role indicator - glowing border based on role */}
                        <div
                          className={`absolute inset-0 rounded-xl ${
                            member.role === "admin"
                              ? "bg-gradient-to-r from-purple-500/20 via-purple-500/5 to-transparent"
                              : "bg-gradient-to-r from-blue-500/20 via-blue-500/5 to-transparent"
                          } opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                        />

                        <div className="relative p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {/* Avatar with role indicator */}
                            <div className="relative">
                              <motion.div
                                whileHover={{ scale: 1.1, rotate: 10 }}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-glow ${
                                  member.role === "admin"
                                    ? "bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-500/50"
                                    : "bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/50"
                                }`}
                              >
                                <span className="text-lg font-bold text-white">
                                  {member.users.username[0].toUpperCase()}
                                </span>
                              </motion.div>
                              {/* Role indicator dot */}
                              <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0A0F1C] ${
                                  member.role === "admin"
                                    ? "bg-gradient-to-br from-purple-400 to-purple-600 shadow-lg shadow-purple-500/50"
                                    : "bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-500/50"
                                }`}
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p
                                  className={`font-medium text-white ${
                                    member.role === "admin"
                                      ? "group-hover:text-purple-400"
                                      : "group-hover:text-blue-400"
                                  } transition-colors`}
                                >
                                  {member.users.username}
                                </p>
                                {/* Role badge */}
                                <motion.span
                                  whileHover={{ scale: 1.05 }}
                                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold ${
                                    member.role === "admin"
                                      ? "bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-300 border border-purple-500/30 shadow-lg shadow-purple-500/20"
                                      : "bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-300 border border-blue-500/30 shadow-lg shadow-blue-500/20"
                                  } backdrop-blur-sm`}
                                >
                                  {member.role.charAt(0).toUpperCase() +
                                    member.role.slice(1)}
                                </motion.span>
                              </div>
                              <p className="text-sm text-gray-400">
                                {member.users.email}
                              </p>
                            </div>
                          </div>

                          {/* Delete button for admins */}
                          {team.userRole === "admin" &&
                            member.role !== "admin" && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() =>
                                  handleRemoveMember(member.users.id)
                                }
                                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </motion.button>
                            )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Add Member Form */}
              {team.userRole === "admin" && (
                <div className="sticky bottom-0 pt-4 bg-[#0A0F1C]">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-xl blur-xl" />
                    <div className="relative p-4 rounded-xl bg-white/5 border border-white/10">
                      <form onSubmit={handleAddMember} className="flex gap-4">
                        <input
                          type="email"
                          value={newMemberEmail}
                          onChange={(e) => setNewMemberEmail(e.target.value)}
                          placeholder="Enter member's email"
                          className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          disabled={isAddingMember}
                        />
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="submit"
                          disabled={isAddingMember || !newMemberEmail}
                          className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-glow"
                        >
                          {isAddingMember ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                              <span>Adding...</span>
                            </div>
                          ) : (
                            "Add Member"
                          )}
                        </motion.button>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Tasks content
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Team Tasks</h3>
                {team.userRole === "admin" && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsCreateTaskModalOpen(true)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white"
                  >
                    Create Task
                  </motion.button>
                )}
              </div>
              <TaskList teamId={team.id} onTaskClick={handleTaskClick} />
            </div>
          )}
        </div>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {isCreateTaskModalOpen && (
          <CreateTaskModal
            isOpen={isCreateTaskModalOpen}
            onClose={() => setIsCreateTaskModalOpen(false)}
            teamId={team.id}
            onTaskCreated={handleTaskCreated}
          />
        )}
        {selectedTask && (
          <TaskDetails
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onTaskUpdated={handleTaskUpdated}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

TeamDetails.propTypes = {
  team: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    memberCount: PropTypes.number,
    userRole: PropTypes.string,
    created_at: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default TeamDetails;
