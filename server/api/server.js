const http = require("http");
const app = require("./app");
const { initializeSocket } = require("./socket");
require("dotenv").config();

const port = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with the server
const io = initializeSocket(server);

// Start the server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`WebSocket server is running on ws://localhost:${port}`);
});

// Handle server errors
server.on("error", (error) => {
  console.error("Server error:", error);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  // Don't exit the process, just log the error
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Don't exit the process, just log the error
});

module.exports = server;
