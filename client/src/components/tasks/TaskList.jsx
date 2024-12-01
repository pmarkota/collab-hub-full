import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import api from "../../utils/api";
import {
  Trash2,
  MoreVertical,
  Calendar,
  Clock,
  AlertCircle,
} from "lucide-react";

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, taskName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-[#0D1425] rounded-xl p-6 max-w-md w-full"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-red-500/10 rounded-full">
            <AlertCircle className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-white">Confirm Deletion</h3>
        </div>

        <p className="text-gray-400 mb-6">
          Are you sure you want to delete task "
          <span className="text-white">{taskName}</span>"? This action cannot be
          undone.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-600 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
          >
            Delete Task
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const TaskList = ({ teamId, onTaskClick }) => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    taskId: null,
    taskName: "",
  });

  useEffect(() => {
    fetchTasks();
  }, [teamId]);

  const fetchTasks = async () => {
    try {
      const response = await api.get(`/tasks/team/${teamId}`);
      setTasks(response.data || []);
    } catch (error) {
      toast.error("Failed to load tasks");
      console.error("Fetch tasks error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (taskId) => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success("Task deleted successfully");
      fetchTasks();
      setDeleteModal({ isOpen: false, taskId: null, taskName: "" });
    } catch (error) {
      toast.error(error.message || "Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300"
            >
              {/* Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative p-6">
                <div className="flex justify-between items-start mb-4">
                  <div
                    className="space-y-1 flex-1 cursor-pointer"
                    onClick={() => onTaskClick(task)}
                  >
                    <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {task.name}
                    </h3>
                    <p className="text-gray-400 line-clamp-2">
                      {task.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() =>
                        setDeleteModal({
                          isOpen: true,
                          taskId: task.id,
                          taskName: task.name,
                        })
                      }
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"
                      disabled={isDeleting}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`px-3 py-1 text-xs rounded-full ${
                      task.priority === "high"
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : task.priority === "medium"
                        ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                        : "bg-green-500/10 text-green-400 border border-green-500/20"
                    }`}
                  >
                    {task.priority}
                  </span>
                  <span
                    className={`px-3 py-1 text-xs rounded-full ${
                      task.status === "completed"
                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                        : task.status === "in_progress"
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                    }`}
                  >
                    {task.status}
                  </span>
                  {task.due_date && (
                    <span className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  )}
                  {task.estimated_hours && (
                    <span className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Clock className="w-3.5 h-3.5" />
                      {task.estimated_hours}h
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-400">No tasks found</div>
        )}
      </div>

      <AnimatePresence>
        {deleteModal.isOpen && (
          <DeleteConfirmationModal
            isOpen={deleteModal.isOpen}
            onClose={() =>
              setDeleteModal({ isOpen: false, taskId: null, taskName: "" })
            }
            onConfirm={() => handleDelete(deleteModal.taskId)}
            taskName={deleteModal.taskName}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default TaskList;
