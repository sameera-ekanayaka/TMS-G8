// backend/routes/notificationRoutes.js
// Notification management endpoints
// Member 2 (Subanya)

const express = require("express");
const router = express.Router();
const {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: User notification management endpoints
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get all notifications for the logged-in user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications for the user (unread first, then read)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       message:
 *                         type: string
 *                       isRead:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized - no valid token
 *       500:
 *         description: Internal server error
 */
router.get("/", protect, getUserNotifications);

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications for the logged-in user as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 count:
 *                   type: integer
 *       401:
 *         description: Unauthorized - no valid token
 *       500:
 *         description: Internal server error
 */
router.patch("/read-all", protect, markAllNotificationsAsRead);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark a single notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       400:
 *         description: Invalid notification ID
 *       401:
 *         description: Unauthorized - no valid token
 *       403:
 *         description: Forbidden - you can only mark your own notifications
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
router.patch("/:id/read", protect, markNotificationAsRead);

module.exports = router;

