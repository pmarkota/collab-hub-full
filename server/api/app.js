const express = require("express");
const cors = require("cors");
const requestLogger = require("./middleware/logger");
const { apiLimiter, authLimiter } = require("./middleware/rateLimiter");
const { validateTask, validateComment } = require("./middleware/validation");
const fileUpload = require("express-fileupload");

const app = express();

// Global middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use("/api", apiLimiter);
app.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
    useTempFiles: true,
    tempFileDir: "/tmp/",
    debug: true,
    createParentPath: true,
    abortOnLimit: true,
    responseOnLimit: "File size limit exceeded (50MB)",
    safeFileNames: true,
    preserveExtension: true,
  })
);

// Import route handlers
const usersRoute = require("./routes/usersRoute");
const teamsRoute = require("./routes/teamsRoute");
const tasksRoute = require("./routes/tasksRoute");
const taskCommentsRoute = require("./routes/taskCommentsRoute");
const filesRoute = require("./routes/filesRoute");

// Create router instance
const router = express.Router();

// Apply auth rate limiting to login/register routes
router.use("/users/login", authLimiter);
router.use("/users/register", authLimiter);

// Mount routes
router.use("/users", usersRoute);
router.use("/teams", teamsRoute);
router.use("/tasks", tasksRoute);
router.use("/tasks", taskCommentsRoute);
router.use("/files", filesRoute);

// Mount router to app
app.use("/api", router);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Something went wrong!",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

module.exports = app;
