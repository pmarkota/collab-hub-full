import { useState } from "react";
import { motion } from "framer-motion";
import PropTypes from "prop-types";
import api from "../../utils/api";
import { toast } from "react-hot-toast";

const CreateTaskModal = ({ isOpen, onClose, teamId, onTaskCreated }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    priority: "medium",
    due_date: "",
    estimated_hours: "",
    status: "pending",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.post("/tasks", {
        ...formData,
        team_id: teamId,
      });
      onTaskCreated(response.data);
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to create task");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

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
        className="relative w-full max-w-lg bg-[#0D1425] rounded-xl overflow-hidden"
      >
        {/* Header with gradient border */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-x" />
          <div className="relative p-6 bg-[#0D1425] m-[1px]">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Create New Task</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            {/* Task Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Task Name
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg blur-md opacity-75 group-hover:opacity-100 transition-opacity" />
                <input
                  type="text"
                  required
                  className="relative w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter task name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Description
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg blur-md opacity-75 group-hover:opacity-100 transition-opacity" />
                <textarea
                  className="relative w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-24 resize-none"
                  placeholder="Describe the task"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Priority and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Priority
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg blur-md opacity-75 group-hover:opacity-100 transition-opacity" />
                  <select
                    className="relative w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    style={{
                      WebkitAppearance: "none",
                      MozAppearance: "none",
                    }}
                  >
                    <option value="low" className="bg-[#0D1425] text-white">
                      Low
                    </option>
                    <option value="medium" className="bg-[#0D1425] text-white">
                      Medium
                    </option>
                    <option value="high" className="bg-[#0D1425] text-white">
                      High
                    </option>
                  </select>
                  {/* Custom dropdown arrow */}
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Status
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg blur-md opacity-75 group-hover:opacity-100 transition-opacity" />
                  <select
                    className="relative w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    style={{
                      WebkitAppearance: "none",
                      MozAppearance: "none",
                    }}
                  >
                    <option value="pending" className="bg-[#0D1425] text-white">
                      Pending
                    </option>
                    <option
                      value="in_progress"
                      className="bg-[#0D1425] text-white"
                    >
                      In Progress
                    </option>
                    <option
                      value="completed"
                      className="bg-[#0D1425] text-white"
                    >
                      Completed
                    </option>
                  </select>
                  {/* Custom dropdown arrow */}
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Due Date and Estimated Hours */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Due Date
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg blur-md opacity-75 group-hover:opacity-100 transition-opacity" />
                  <input
                    type="date"
                    required
                    className="relative w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={formData.due_date}
                    onChange={(e) =>
                      setFormData({ ...formData, due_date: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Estimated Hours
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg blur-md opacity-75 group-hover:opacity-100 transition-opacity" />
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    className="relative w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="0.0"
                    value={formData.estimated_hours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimated_hours: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-white/10 rounded-lg text-gray-300 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="flex-1 relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur-md opacity-75 group-hover:opacity-100 transition-opacity" />
              <div className="relative px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white flex items-center justify-center">
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Create Task"
                )}
              </div>
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

CreateTaskModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  teamId: PropTypes.string.isRequired,
  onTaskCreated: PropTypes.func.isRequired,
};

export default CreateTaskModal;
