import { io } from "socket.io-client";
import { getToken } from "./auth";

let socket = null;
let reconnectTimer = null;
const MAX_RECONNECT_ATTEMPTS = 5;
let reconnectAttempts = 0;

export const initializeSocket = () => {
  if (socket?.connected) {
    console.log("[Socket] Reusing existing connection:", socket.id);
    return socket;
  }

  // Clean up existing socket if any
  if (socket) {
    console.log("[Socket] Cleaning up existing socket");
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  const token = getToken();
  if (!token) {
    console.error("[Socket] No token available");
    return null;
  }

  // Remove 'Bearer ' prefix if it exists
  const cleanToken = token.replace("Bearer ", "");

  console.log("[Socket] Initializing new connection...");

  socket = io("http://localhost:3000", {
    auth: {
      token: cleanToken, // Send clean token
    },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  socket.on("connect", () => {
    console.log("[Socket] Connected successfully:", socket.id);
    reconnectAttempts = 0;
  });

  socket.on("connect_error", (error) => {
    console.error("[Socket] Connection error:", error.message);
    if (error.message === "Authentication failed") {
      socket.disconnect();
      socket = null;
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("[Socket] Disconnected:", reason);
  });

  socket.on("error", (error) => {
    console.error("[Socket] Socket error:", error);
  });

  // Add event listener for team events
  socket.on("teamEvent", (data) => {
    console.log("[Socket] Received team event:", data);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket?.connected) {
    console.log("[Socket] No active connection, initializing new socket");
    return initializeSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    console.log("[Socket] Disconnecting socket:", socket.id);
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    reconnectAttempts = 0;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }
};
