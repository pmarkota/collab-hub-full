const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const {
  uploadFile,
  downloadFile,
  deleteFile,
  getTaskFiles,
} = require("../controllers/fileController");

router.use(authenticateToken);

// File upload/download
router.post("/tasks/:taskId/upload", uploadFile);
router.get("/:fileId/download", downloadFile);
router.delete("/:fileId", deleteFile);

// Get task files
router.get("/tasks/:taskId", getTaskFiles);

module.exports = router;
