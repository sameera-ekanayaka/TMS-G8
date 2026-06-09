// backend/services/socketService.js
// Socket.io utility functions for emitting notifications
// Server.js manages the actual connections
// Member 2 (Subanya)

// This function initializes Socket.io event handlers
// The connectedUsers object is managed in server.js
const initializeSocket = (io) => {
  // Socket.io events are already handled in server.js
  // This function is here for future extensibility
  console.log("Socket.io initialized");
};

// Export a simple object for future use
module.exports = {
  initializeSocket,
};