const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const {
  createTask,
  updateTask,
  deleteTask,
  getTask,
  getTeamTasks,
  assignTask,
  updateTaskProgress,
  addTaskDependency,
  removeTaskDependency,
  getTaskDependencies,
} = require("../controllers/tasksController");

router.use(authenticateToken);

// Task CRUD
router.post("/", createTask);
router.get("/team/:teamId", getTeamTasks);
router.get("/:taskId", getTask);
router.put("/:taskId", updateTask);
router.delete("/:taskId", deleteTask);

// Task Assignment
router.post("/:taskId/assign", assignTask);

// Task Progress
router.put("/:taskId/progress", updateTaskProgress);

// Task Dependencies
router.post("/:taskId/dependencies", addTaskDependency);
router.delete("/:taskId/dependencies/:dependentTaskId", removeTaskDependency);
router.get("/:taskId/dependencies", getTaskDependencies);

module.exports = router;
