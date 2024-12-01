import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PropTypes from "prop-types";
import api from "../../utils/api";
import { toast } from "react-hot-toast";

const TaskDetails = ({ task, onClose, onTaskCreated }) => {
  const [comments, setComments] = useState([]);
  const [files, setFiles] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetchData();
  }, [task.id]);

  const fetchData = async () => {
    try {
      const [commentsResponse, filesResponse, tasksResponse] =
        await Promise.all([
          api.get(`/tasks/${task.id}/comments`),
          api.get(`/files/tasks/${task.id}`),
          api.get(`/tasks/team/${task.team_id}`),
        ]);

      setComments(commentsResponse.data || []);
      setFiles(filesResponse.data || []);
      setTasks(tasksResponse.data || []);
    } catch (error) {
      toast.error("Failed to load task details");
      console.error("Task details error:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleTaskCreated = (newTask) => {
    setTasks((prevTasks) => [...prevTasks, newTask]);
    if (onTaskCreated) {
      onTaskCreated(newTask);
    }
    toast.success("Task created successfully");
    fetchData();
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await api.post(`/tasks/${task.id}/comments`, {
        comment: newComment,
      });
      setComments([...comments, response.data]);
      setNewComment("");
      toast.success("Comment added successfully");
    } catch (error) {
      toast.error(error.message || "Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e) => {
    console.log("handleFileUpload triggered", e);
    console.log("Files from event:", e.target.files);

    const file = e.target.files?.[0];
    if (!file) {
      console.log("No file selected");
      return;
    }

    console.log("File selected:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    const formData = new FormData();
    formData.append("file", file);

    // Log FormData contents
    for (let pair of formData.entries()) {
      console.log("FormData content:", pair[0], pair[1]);
    }

    try {
      console.log(`Attempting to upload file to task ${task.id}`);
      const response = await api.post(
        `/files/tasks/${task.id}/upload`,
        formData,
        {
          headers: {
            // Remove Content-Type header, let the browser set it with boundary
            // 'Content-Type': 'multipart/form-data',
          },
        }
      );
      console.log("Upload response:", response);
      setFiles([response.data, ...files]);
      toast.success("File uploaded successfully");
    } catch (error) {
      console.error("File upload error:", error);
      console.error("Error details:", error.response?.data);
      toast.error(error.message || "Failed to upload file");
    }
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
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-4xl bg-[#0D1425] rounded-xl shadow-xl flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-x" />
          <div className="relative p-6 bg-[#0D1425] m-[1px]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">{task.name}</h2>
                <p className="text-gray-400 mt-1">{task.description}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Task Info Cards */}
        <div className="grid grid-cols-3 gap-4 p-6 border-b border-white/10 bg-white/5">
          <div className="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-white/10">
            <div className="text-sm text-gray-400 mb-1">Status</div>
            <div className="text-white font-medium">
              {task.status || "Pending"}
            </div>
          </div>
          <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-white/10">
            <div className="text-sm text-gray-400 mb-1">Priority</div>
            <div className="text-white font-medium capitalize">
              {task.priority}
            </div>
          </div>
          <div className="p-4 bg-gradient-to-br from-pink-500/10 to-red-500/10 rounded-xl border border-white/10">
            <div className="text-sm text-gray-400 mb-1">Due Date</div>
            <div className="text-white font-medium">
              {new Date(task.due_date).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 min-h-0">
          {/* Comments Section */}
          <div className="flex-1 border-r border-white/10 flex flex-col">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Comments</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {isLoadingData ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No comments yet
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                            <span className="text-sm font-bold text-white">
                              {comment.user?.username?.[0]?.toUpperCase()}
                            </span>
                          </div>
                          <span className="text-white font-medium">
                            {comment.user?.username}
                          </span>
                        </div>
                        <span className="text-sm text-gray-400">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-300 pl-[52px]">
                        {comment.comment}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="p-6 border-t border-white/10 bg-white/5">
              <form onSubmit={handleAddComment} className="flex gap-4">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !newComment.trim()}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl disabled:opacity-50 hover:from-blue-600 hover:to-purple-600 transition-colors"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Post"
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Files Section */}
          <div className="w-80 flex flex-col">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Files</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <input
                  type="file"
                  onChange={(e) => {
                    console.log("File input change event", e);
                    handleFileUpload(e);
                  }}
                  onClick={(e) => console.log("File input clicked", e)}
                  className="hidden"
                  id="file-upload"
                  accept="*/*"
                />
                <label
                  htmlFor="file-upload"
                  className="block p-4 border-2 border-dashed border-white/10 rounded-xl text-center cursor-pointer hover:border-white/20 transition-colors"
                  onClick={(e) => {
                    console.log("File upload label clicked", e);
                    // Reset the file input value to allow selecting the same file again
                    document.getElementById("file-upload").value = "";
                  }}
                >
                  <div className="text-4xl mb-2">📁</div>
                  <span className="text-gray-400">Click to upload file</span>
                </label>
                <div className="space-y-3">
                  {isLoadingData ? (
                    <div className="flex justify-center py-4">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : files.length === 0 ? (
                    <div className="text-center py-4 text-gray-400">
                      No files attached
                    </div>
                  ) : (
                    files.map((file) => (
                      <div
                        key={file.id}
                        className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-colors"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xl">📄</span>
                          <span className="text-white truncate font-medium">
                            {file.file_name}
                          </span>
                        </div>
                        <div className="flex justify-end">
                          <a
                            href={file.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                          >
                            Download ⬇️
                          </a>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

TaskDetails.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    status: PropTypes.string,
    priority: PropTypes.string,
    due_date: PropTypes.string,
    team_id: PropTypes.string.isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onTaskCreated: PropTypes.func,
};

export default TaskDetails;
