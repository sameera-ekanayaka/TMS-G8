// backend/routes/commentRoutes.js
// Comment management endpoints
// Member 2 (Subanya)

const express = require("express");
const router = express.Router();
const {
  createComment,
  getCommentsByTaskId,
} = require("../controllers/commentController");
const { protect } = require("../middleware/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Task comment management endpoints
 */

/**
 * @swagger
 * /api/tasks/{id}/comments:
 *   post:
 *     summary: Add a comment to a task
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 example: "This task needs more clarification on requirements"
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       400:
 *         description: Validation error (missing content, invalid task ID)
 *       401:
 *         description: Unauthorized - no valid token
 *       403:
 *         description: Forbidden - only assigned users and project managers can comment
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */
router.post("/:id/comments", protect, createComment);

/**
 * @swagger
 * /api/tasks/{id}/comments:
 *   get:
 *     summary: Get all comments for a task
 *     tags: [Comments]
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
 *         description: List of comments for the task
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comments:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Invalid task ID
 *       401:
 *         description: Unauthorized - no valid token
 *       403:
 *         description: Forbidden - only assigned users and project managers can view
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id/comments", protect, getCommentsByTaskId);

module.exports = router;