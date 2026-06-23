// backend/controllers/notificationController.js
// Handles notification operations: retrieve and mark as read
// Only return notifications for the logged-in user
// Member 2 (Subanya)


const prisma = require("../lib/prisma");

// ════════ GET /api/notifications ════════════════════════════════════════════
// Get all notifications for the logged-in user
// Returns unread and read notifications
// Returns: { notifications }
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id; // From protect middleware

    // Fetch all notifications for this user (unread first, then read)
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: [
        { isRead: "asc" }, // Unread notifications first
        { createdAt: "desc" }, // Most recent first within each group
      ],
    });

    return res.status(200).json({
      notifications,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch notifications",
    });
  }
};

// ════════ PATCH /api/notifications/:id/read ═══════════════════════════════
// Mark a single notification as read
// Only the notification owner can mark it as read
// Returns: { message, notification }
const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // From protect middleware

    // Validate notification ID
    const notificationId = parseInt(id);
    if (isNaN(notificationId)) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Notification ID must be a valid number",
      });
    }

    // Check if notification exists
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return res.status(404).json({
        error: "Not Found",
        message: "Notification not found",
      });
    }

    // Permission check: User can only mark their own notifications as read
    if (notification.userId !== userId) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You can only mark your own notifications as read",
      });
    }

    // Update the notification to mark as read
    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return res.status(200).json({
      message: "Notification marked as read",
      notification: updatedNotification,
    });
  } catch (error) {
    console.error("Mark notification as read error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to mark notification as read",
    });
  }
};

// ════════ PATCH /api/notifications/read-all ════════════════════════════════
// Mark all notifications for the logged-in user as read
// Returns: { message, count }
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id; // From protect middleware

    // Update all unread notifications for this user to read
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return res.status(200).json({
      message: "All notifications marked as read",
      count: result.count,
    });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to mark all notifications as read",
    });
  }
};

module.exports = {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};