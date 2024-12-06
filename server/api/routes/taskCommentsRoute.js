const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const {
  getTaskComments,
  createComment,
} = require("../controllers/taskCommentsController");

router.use(authenticateToken);

// Get task comments - remove /tasks prefix since we'll mount under /tasks
router.get("/:taskId/comments", getTaskComments);
router.post("/:taskId/comments", createComment);

module.exports = router;
