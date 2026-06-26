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

// ── notifyAdmins ──────────────────────────────────────────────────────────────
// Persist a notification for ALL active ADMIN users and push it live via socket.
//
// Options:
//   message  — notification text (should mention task title + project for clarity)
//   taskId   — optional; links the notification to a task so the frontend can
//              navigate directly to it when the bell item is clicked
//   actorId  — accepted for call-site compatibility but no longer used: admins
//              get a complete oversight feed of every event, including their own
//              actions, so they always have something in their notification panel.
//   event    — socket event name (default: "admin_update")
//
// Called fire-and-forget from controllers — errors are caught internally so
// they never break the HTTP response.
const notifyAdmins = async (
  io,
  { message, taskId = null, actorId = null, event = "admin_update" }
) => {
  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", isActive: true },
      select: { id: true },
    });

    for (const admin of admins) {
      const dbNotification = await prisma.notification.create({
        data: { message, userId: admin.id, isRead: false, taskId },
      });

      if (io) {
        io.to(`user:${admin.id}`).emit(event, {
          message,
          taskId,
          id: dbNotification.id,
          createdAt: dbNotification.createdAt,
          isRead: false,
        });
      }
    }
  } catch (err) {
    console.error("[notifyAdmins] Failed:", err.message);
  }
};

module.exports = {
  initializeSocket,
  sendUserNotification,
  notifyTaskParticipants,
  notifyAdmins,
};
