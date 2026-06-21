// backend/routes/attachmentRoutes.js
// Attachment upload and retrieval endpoints
// Member 2 (Subanya)

const express = require("express");
const router = express.Router();
const { uploadAttachment, getAttachments } = require("../controllers/attachmentController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

/**
 * @swagger
 * tags:
 *   name: Attachments
 *   description: Task attachment upload and retrieval endpoints
 */

/**
 * @swagger
 * /api/tasks/{id}/attachments:
 *   post:
 *     summary: Upload an attachment to a task
 *     tags: [Attachments]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload (PDF, DOC, IMAGE, etc.)
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *       400:
 *         description: Validation error (no file, invalid task ID, file too large)
 *       401:
 *         description: Unauthorized - no valid token
 *       403:
 *         description: Forbidden - only assigned users and project managers can upload
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/:id/attachments",
  protect,
  upload.single("file"),
  uploadAttachment
);

/**
 * @swagger
 * /api/tasks/{id}/attachments:
 *   get:
 *     summary: Get all attachments for a task
 *     tags: [Attachments]
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
 *         description: List of attachments for the task
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
router.get("/:id/attachments", protect, getAttachments);

module.exports = router;