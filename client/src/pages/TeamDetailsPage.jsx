import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../utils/api";
import { toast } from "react-hot-toast";
import {
  Users2,
  Calendar,
  BarChart3,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trash2,
  ChevronRight,
  X,
  User,
  MessageSquare,
  Upload,
  Download,
  FileText,
  Image,
  File,
} from "lucide-react";
import { getSocket } from "../utils/socket";
import { debounce } from "lodash";

const TeamDetailsPage = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskComments, setTaskComments] = useState([]);
  const [taskFiles, setTaskFiles] = useState([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [teamResponse, membersResponse, tasksResponse] =
          await Promise.all([
            api.get(`/teams/${teamId}`),
            api.get(`/teams/${teamId}/members`),
            api.get(`/tasks/team/${teamId}`),
          ]);

        setTeam(teamResponse.data);
        setMembers(membersResponse.data);
        setTasks(tasksResponse.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching team details:", err);
        setError(err.message);
        toast.error(err.message || "Failed to load team details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [teamId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      console.log("[TeamDetailsPage] No socket available");
      return;
    }

    const handleTeamEvent = async (data) => {
      console.log("[TeamDetailsPage] Team event received:", data);
      const currentUserId = JSON.parse(localStorage.getItem("user"))?.id;
      if (!currentUserId) return;

      if (data.type === "MEMBER_ADDED") {
        if (data.isAdmin) {
          toast.success(`Successfully added member to team: ${data.teamName}`);
          // Fetch fresh data immediately for admin
          const { data: newMembers } = await api.get(
            `/teams/${teamId}/members`
          );
          setMembers(newMembers);
        } else if (currentUserId === data.userId) {
          toast.success(`You've been added to team: ${data.teamName}`);
          // For the added user, they should see this in their TeamList
        }
      } else if (data.type === "MEMBER_REMOVED") {
        if (data.isAdmin) {
          toast.success(
            `Successfully removed member from team: ${data.teamName}`
          );
          // Fetch fresh data immediately for admin
          const { data: newMembers } = await api.get(
            `/teams/${teamId}/members`
          );
          setMembers(newMembers);
        } else if (currentUserId === data.userId) {
          toast.error(`You've been removed from team: ${data.teamName}`);
          navigate("/teams"); // Redirect to teams list if removed
        }
      }
    };

    socket.on("teamEvent", handleTeamEvent);

    return () => {
      socket.off("teamEvent", handleTeamEvent);
    };
  }, [teamId, navigate]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberEmail) return;

    setIsAddingMember(true);
    try {
      await api.post(`/teams/${teamId}/members`, { email: newMemberEmail });
      setNewMemberEmail("");
      // Don't need to fetch here as socket will handle it
    } catch (err) {
      console.error("Error adding member:", err);
      if (err.response?.status === 429) {
        toast.error("Please wait a moment before trying again");
      } else if (err.response?.data?.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error("Failed to add member");
      }
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!memberId) return;

    try {
      await api.delete(`/teams/${teamId}/members/${memberId}`);
      // Socket will handle the UI updates
    } catch (err) {
      console.error("Error removing member:", err);
      toast.error(err.message || "Failed to remove member");
    }
  };

  const handleTaskClick = async (taskId) => {
    try {
      const [taskResponse, commentsResponse, filesResponse] = await Promise.all(
        [
          api.get(`/tasks/${taskId}`),
          api.get(`/tasks/${taskId}/comments`),
          api.get(`/files/tasks/${taskId}`),
        ]
      );

      console.log("Task data:", taskResponse.data);
      console.log("Comments data:", commentsResponse.data);
      console.log("Files data:", filesResponse.data);
      console.log("Files response:", filesResponse);

      // Check if data exists and has the expected structure
      setSelectedTask(taskResponse.data);
      setTaskComments(commentsResponse.data || []);
      setTaskFiles(filesResponse.data || []);
    } catch (err) {
      console.error("Error fetching task details:", err);
      toast.error("Failed to load task details");
      setSelectedTask(null);
      setTaskComments([]);
      setTaskFiles([]);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post(
        `/files/tasks/${selectedTask.id}/upload`,
        formData
      );
      console.log("Upload response:", response.data);

      // Add the new file to the list
      const newFile = {
        id: response.data.id,
        file_name: response.data.file_name,
        file_url: response.data.file_url,
        created_at: response.data.created_at,
        uploaded_by: response.data.uploaded_by,
        uploaded_by_user: {
          username: user?.username,
        },
      };

      setTaskFiles((prev) => [...prev, newFile]);
      toast.success("File uploaded successfully");
    } catch (err) {
      console.error("Error uploading file:", err);
      toast.error("Failed to upload file");
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleFileDownload = async (fileId) => {
    try {
      const response = await api.get(`/files/${fileId}/download`);
      window.open(response.data.data.download_url, "_blank");
    } catch (err) {
      console.error("Error downloading file:", err);
      toast.error("Failed to download file");
    }
  };

  const handleFileDelete = async (fileId) => {
    try {
      await api.delete(`/files/${fileId}`);
      setTaskFiles((prev) => prev.filter((f) => f.id !== fileId));
      toast.success("File deleted successfully");
    } catch (err) {
      console.error("Error deleting file:", err);
      toast.error("Failed to delete file");
    }
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split(".").pop().toLowerCase();
    if (["jpg", "jpeg", "png", "gif"].includes(ext)) return Image;
    if (["pdf", "doc", "docx"].includes(ext)) return FileText;
    return File;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-gray-400">Loading team details...</p>
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

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "text-green-400 bg-green-400/10 ring-green-400/20";
      case "in_progress":
        return "text-yellow-400 bg-yellow-400/10 ring-yellow-400/20";
      default:
        return "text-blue-400 bg-blue-400/10 ring-blue-400/20";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4" />;
      case "in_progress":
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <div className="relative">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D1425] to-transparent h-48" />

        {/* Content */}
        <div className="relative px-6 py-8">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate("/teams")}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">{team?.name}</h1>
              <p className="text-gray-400 mt-1">{team?.description}</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              {
                id: "created",
                icon: Calendar,
                label: "Created",
                value: new Date(team?.created_at).toLocaleDateString(),
              },
              {
                id: "members",
                icon: Users2,
                label: "Members",
                value: `${members.length} members`,
              },
              {
                id: "tasks",
                icon: BarChart3,
                label: "Tasks",
                value: `${tasks.length} tasks`,
              },
            ].map((stat) => (
              <div
                key={stat.id}
                className="relative group bg-[#0D1425]/50 backdrop-blur-sm rounded-xl p-4 border border-white/5"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <stat.icon className="w-5 h-5 text-gray-400 mb-2" />
                <p className="text-sm text-gray-400">{stat.label}</p>
                <p className="text-lg font-semibold text-white">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-white/5">
            {["details", "members", "tasks"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 border-b-2 border-blue-500"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative capitalize">{tab}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="py-6"
          >
            {activeTab === "members" && (
              <div className="space-y-6">
                {/* Add Member Form */}
                <form onSubmit={handleAddMember} className="flex gap-3">
                  <div className="flex-1">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg blur-md" />
                      <input
                        type="email"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        placeholder="Enter member's email"
                        className="relative w-full px-4 py-2.5 bg-[#0D1425] border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isAddingMember || !newMemberEmail}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2 min-w-[120px] justify-center"
                  >
                    {isAddingMember ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add Member
                      </>
                    )}
                  </button>
                </form>

                {/* Members List */}
                <div className="bg-[#0D1425]/50 border border-white/5 rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/5">
                    <h3 className="text-lg font-semibold text-white">
                      Team Members
                    </h3>
                  </div>
                  <div className="divide-y divide-white/5">
                    {members.map((member) => (
                      <div
                        key={member.users?.id}
                        className="group px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                            <div className="relative w-10 h-10 bg-[#0D1425] ring-1 ring-white/10 rounded-lg flex items-center justify-center overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 via-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 opacity-0 group-hover:opacity-20 animate-gradient-x" />
                              <span className="relative text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200">
                                {member.users?.username
                                  ?.charAt(0)
                                  .toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-white group-hover:text-blue-200 transition-colors">
                              {member.users?.username}
                            </p>
                            <p className="text-sm text-gray-400">
                              {member.users?.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full ring-1 
                              ${
                                member.role === "admin"
                                  ? "bg-purple-400/10 ring-purple-400/20 text-purple-400"
                                  : "bg-blue-400/10 ring-blue-400/20 text-blue-400"
                              }`}
                          >
                            {member.role}
                          </span>
                          {member.role !== "admin" && (
                            <button
                              onClick={() =>
                                handleRemoveMember(member.users?.id)
                              }
                              className="p-2 text-gray-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "tasks" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-white">
                    Team Tasks
                  </h3>
                  <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Create Task
                  </button>
                </div>

                {/* Task List */}
                <div className="grid gap-3">
                  {tasks.map((task) => (
                    <motion.div
                      key={task.id}
                      onClick={() => handleTaskClick(task.id)}
                      className="group relative overflow-hidden rounded-xl bg-[#0D1425]/50 border border-white/5 p-4 cursor-pointer"
                      whileHover={{ scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-3">
                              <h4 className="text-lg font-medium text-white group-hover:text-blue-400 transition-colors">
                                {task.name}
                              </h4>
                              <span
                                className={`px-2.5 py-1 text-xs font-medium rounded-full ring-1 flex items-center gap-1.5 ${getStatusColor(
                                  task.status
                                )}`}
                              >
                                {getStatusIcon(task.status)}
                                {task.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 line-clamp-2">
                              {task.description}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-2 text-gray-400">
                              <Calendar className="w-4 h-4" />
                              {new Date(task.due_date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-2 text-gray-400">
                              <User className="w-4 h-4" />
                              {task.assigned_to || "Unassigned"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                            <MessageSquare className="w-4 h-4" />
                            <span>{task.comment_count || 0} comments</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Task Details Modal */}
                <AnimatePresence>
                  {selectedTask && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                      onClick={() => setSelectedTask(null)}
                    >
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="relative w-full max-w-4xl bg-[#0D1425] rounded-2xl shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Animated Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5" />
                        <div className="absolute inset-0 bg-[#0D1425]/90 backdrop-blur-sm" />

                        {/* Header */}
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
                          <div className="relative p-8 bg-[#0D1425] m-[1px] rounded-t-2xl">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                  <h2 className="text-2xl font-bold text-white">
                                    {selectedTask.name || "Untitled Task"}
                                  </h2>
                                  <span
                                    className={`px-3 py-1 text-xs font-medium rounded-full ring-1 flex items-center gap-1.5 ${getStatusColor(
                                      selectedTask.status
                                    )}`}
                                  >
                                    {getStatusIcon(selectedTask.status)}
                                    {selectedTask.status}
                                  </span>
                                </div>
                                <p className="text-gray-400 max-w-2xl">
                                  {selectedTask.description || "No description"}
                                </p>
                              </div>
                              <button
                                onClick={() => setSelectedTask(null)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors group"
                              >
                                <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="relative p-8 space-y-8">
                          {/* Task Details Grid */}
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                              {
                                label: "Due Date",
                                value: selectedTask.due_date
                                  ? new Date(
                                      selectedTask.due_date
                                    ).toLocaleDateString()
                                  : "No due date",
                                icon: Calendar,
                              },
                              {
                                label: "Assigned To",
                                value:
                                  selectedTask.assigned_to?.username ||
                                  "Unassigned",
                                icon: User,
                              },
                              {
                                label: "Priority",
                                value: selectedTask.priority || "None",
                                icon: AlertTriangle,
                              },
                              {
                                label: "Comments",
                                value: `${taskComments?.length || 0} comments`,
                                icon: MessageSquare,
                              },
                            ].map((item) => (
                              <div
                                key={item.label}
                                className="relative group rounded-xl bg-white/5 p-4 border border-white/10 hover:border-white/20 transition-colors"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="p-2 rounded-lg bg-white/5 text-gray-400 group-hover:text-blue-400 transition-colors">
                                    <item.icon className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-400">
                                      {item.label}
                                    </p>
                                    <p className="text-white font-medium">
                                      {item.value}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Files Section */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold text-white">
                                Files
                              </h3>
                              <div className="flex items-center gap-3">
                                <input
                                  type="file"
                                  ref={fileInputRef}
                                  onChange={handleFileUpload}
                                  className="hidden"
                                />
                                <button
                                  onClick={() => fileInputRef.current?.click()}
                                  disabled={isUploadingFile}
                                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isUploadingFile ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Upload className="w-4 h-4" />
                                      Upload File
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {taskFiles?.map((file) => {
                                if (!file?.file_name) return null;
                                const FileIcon = getFileIcon(file.file_name);
                                return (
                                  <motion.div
                                    key={file.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="group relative rounded-xl bg-white/5 p-4 border border-white/10 hover:border-white/20 transition-all duration-300"
                                  >
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative flex items-center gap-4">
                                      <div className="p-3 rounded-lg bg-white/5">
                                        <FileIcon className="w-6 h-6 text-blue-400" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-white font-medium truncate">
                                          {file.file_name}
                                        </p>
                                        <p className="text-sm text-gray-400">
                                          Uploaded by{" "}
                                          {file.uploaded_by_user?.username ||
                                            "Unknown"}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {file.created_at
                                            ? new Date(
                                                file.created_at
                                              ).toLocaleString()
                                            : "Just now"}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleFileDownload(file.id);
                                          }}
                                          className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                                        >
                                          <Download className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleFileDelete(file.id);
                                          }}
                                          className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>

                            {taskFiles.length === 0 && (
                              <div className="text-center py-8">
                                <FileText className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                                <p className="text-gray-400">
                                  No files attached
                                </p>
                                <p className="text-sm text-gray-500">
                                  Upload files to share with your team
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Comments Section */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold text-white">
                                Comments
                              </h3>
                              <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2 text-sm">
                                <Plus className="w-4 h-4" />
                                Add Comment
                              </button>
                            </div>

                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4">
                              {taskComments?.length > 0 ? (
                                taskComments.map((comment) => (
                                  <motion.div
                                    key={comment.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="group relative rounded-xl bg-white/5 p-4 border border-white/10 hover:border-white/20 transition-all duration-300"
                                  >
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                          <div className="relative">
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-75" />
                                            <div className="relative w-8 h-8 bg-[#0D1425] rounded-full flex items-center justify-center">
                                              <span className="text-sm font-medium text-white">
                                                {comment.user?.username
                                                  ?.charAt(0)
                                                  ?.toUpperCase() || "?"}
                                              </span>
                                            </div>
                                          </div>
                                          <div>
                                            <p className="font-medium text-white">
                                              {comment.user?.username ||
                                                "Unknown User"}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                              {comment.created_at
                                                ? new Date(
                                                    comment.created_at
                                                  ).toLocaleString()
                                                : "Unknown date"}
                                            </p>
                                          </div>
                                        </div>
                                        <button className="p-1.5 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                      <p className="text-gray-300 pl-11">
                                        {comment.comment}
                                      </p>
                                    </div>
                                  </motion.div>
                                ))
                              ) : (
                                <div className="text-center py-8">
                                  <MessageSquare className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                                  <p className="text-gray-400">
                                    No comments yet
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Be the first to comment on this task
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {activeTab === "details" && (
              <div className="space-y-6">
                <div className="bg-[#0D1425]/50 border border-white/5 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    About Team
                  </h3>
                  <p className="text-gray-400">{team?.description}</p>
                </div>
                {/* Add more team details sections as needed */}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TeamDetailsPage;
