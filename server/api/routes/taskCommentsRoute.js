const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const {
  getTaskComments,
  createComment,
} = require("../controllers/taskCommentsController");

router.use(authenticateToken);

// Get task comments
router.get("/tasks/:taskId/comments", getTaskComments);

// Create comment
router.post("/tasks/:taskId/comments", createComment);

module.exports = router;
