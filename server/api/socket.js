const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io = null;
const connectedUsers = new Map();

const initializeSocket = (server) => {
  if (io) return io;

  console.log("[Socket] Initializing socket server...");

  io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    pingTimeout: 30000,
    pingInterval: 10000,
    connectTimeout: 30000,
    allowEIO3: true,
    maxHttpBufferSize: 1e8,
  });

  io.engine.on("connection_error", (err) => {
    console.log("[Socket] Connection error:", err);
  });

  io.use(async (socket, next) => {
    try {
      console.log("[Socket] New connection attempt...");
      const token = socket.handshake.auth.token;

      if (!token) {
        console.log("[Socket] No token provided");
        return next(new Error("No token provided"));
      }

      try {
        // Verify token and extract userId
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded || !decoded.userId) {
          console.log("[Socket] Invalid token payload");
          return next(new Error("Invalid token"));
        }

        // Store userId in socket object
        socket.userId = decoded.userId;
        console.log("[Socket] User authenticated:", socket.userId);

        // Clean up existing connection if any
        const existingSocket = connectedUsers.get(socket.userId);
        if (existingSocket && existingSocket.id !== socket.id) {
          console.log(
            `[Socket] Cleaning up existing connection for user ${socket.userId}`
          );
          existingSocket.disconnect(true);
          connectedUsers.delete(socket.userId);
        }

        next();
      } catch (jwtError) {
        console.log("[Socket] JWT verification failed:", jwtError.message);
        return next(new Error("Authentication failed"));
      }
    } catch (err) {
      console.log("[Socket] Auth error:", err.message);
      return next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] User ${socket.userId} connected (${socket.id})`);

    // Store user connection
    connectedUsers.set(socket.userId, socket);
    console.log(`[Socket] Connected users: ${connectedUsers.size}`);

    socket.on("disconnect", (reason) => {
      console.log(
        `[Socket] User ${socket.userId} disconnected (${socket.id}): ${reason}`
      );
      if (connectedUsers.get(socket.userId)?.id === socket.id) {
        connectedUsers.delete(socket.userId);
        console.log(
          `[Socket] Remaining connected users: ${connectedUsers.size}`
        );
      }
    });

    // Add ping/pong for connection health check
    socket.on("ping", () => {
      socket.emit("pong");
    });
  });

  return io;
};

const emitTeamEvent = (eventType, data) => {
  if (!io) {
    console.log("[Socket] Cannot emit event: Socket.io not initialized");
    return;
  }

  console.log(`[Socket] Emitting ${eventType}:`, {
    teamId: data.teamId,
    userId: data.userId,
    adminId: data.adminId,
  });

  try {
    // Emit to admin
    const adminSocket = connectedUsers.get(data.adminId);
    if (adminSocket?.connected) {
      console.log(`[Socket] Emitting to admin ${data.adminId}`);
      adminSocket.emit("teamEvent", {
        type: eventType,
        ...data,
        isAdmin: true,
      });
    } else {
      console.log(
        `[Socket] Admin socket not found or not connected: ${data.adminId}`
      );
    }

    // Emit to affected user if different from admin
    if (data.userId !== data.adminId) {
      const userSocket = connectedUsers.get(data.userId);
      if (userSocket?.connected) {
        console.log(`[Socket] Emitting to user ${data.userId}`);
        userSocket.emit("teamEvent", {
          type: eventType,
          ...data,
          isAdmin: false,
        });
      } else {
        console.log(
          `[Socket] User socket not found or not connected: ${data.userId}`
        );
      }
    }
  } catch (error) {
    console.error("[Socket] Error emitting event:", error);
  }
};

module.exports = { initializeSocket, emitTeamEvent };
