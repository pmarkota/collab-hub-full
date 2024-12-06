const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const fileController = require("../controllers/fileController");

// Basic routes without try-catch
router.get("/tasks/:taskId", authenticateToken, fileController.getTaskFiles);
router.post(
  "/tasks/:taskId/upload",
  authenticateToken,
  fileController.uploadFile
);
router.get("/:fileId/download", authenticateToken, fileController.downloadFile);
router.delete("/:fileId", authenticateToken, fileController.deleteFile);

module.exports = router;
