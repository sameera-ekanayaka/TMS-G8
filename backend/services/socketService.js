// backend/services/socketService.js
// Socket.io utility functions for emitting notifications.
// Connections + rooms are managed in server.js (each socket joins `user:<id>`).
// Member 2 (Subanya)

const prisma = require("../lib/prisma");

// This function initializes Socket.io event handlers
// The connectedUsers object is managed in server.js
const initializeSocket = (io) => {
  // Socket.io events are already handled in server.js
  // This function is here for future extensibility
  console.log("Socket.io initialized");
};

// ── sendUserNotification ──────────────────────────────────────────────────────
// Persist a notification for a user and push it live if they're connected.
// Used for "administrative updates" (role changes, project-manager assignment)
// that the SRS requires users to be notified about. Persisting first means
// offline users still see it on their next fetch/reconnect.
const sendUserNotification = async (io, connectedUsers, userId, message) => {
  if (!userId) return null;
  const dbNotification = await prisma.notification.create({
    data: { message, userId, isRead: false },
  });

  if (io) {
    // Emit to the user's private room (joined server-side from the verified JWT)
    io.to(`user:${userId}`).emit("admin_update", dbNotification);
  }
  return dbNotification;
};

// ── notifyTaskParticipants ────────────────────────────────────────────────────
// Persist + push a notification to a task's participants (its assignees and the
// project's manager), excluding the actor. Used for comment edits and attachment
// uploads so the right people hear about activity on a task.
const notifyTaskParticipants = async (
  io,
  connectedUsers,
  { taskId, assigneeIds = [], managerId, actorId, message, event = "comment_added" }
) => {
  const recipients = new Set([...assigneeIds, managerId].filter(Boolean));
  recipients.delete(actorId);

  for (const userId of recipients) {
    const dbNotification = await prisma.notification.create({
      data: { message, userId, isRead: false, taskId },
    });
    if (io) {
      io.to(`user:${userId}`).emit(event, {
        message,
        taskId,
        id: dbNotification.id,
        createdAt: dbNotification.createdAt,
        isRead: false,
      });
    }
  }
};

module.exports = {
  initializeSocket,
  sendUserNotification,
  notifyTaskParticipants,
};
