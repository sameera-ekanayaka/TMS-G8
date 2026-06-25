// backend/routes/authRoutes.js
// Auth endpoints: login, reset-password
// Member 1 (Sameera)

const express = require("express");
const router = express.Router();
const { login, resetPassword, getMe, forgotPassword } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in and receive a JWT token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@tms.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful — returns token and user
 *       400:
 *         description: Missing email or password
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account deactivated
 */
router.post("/login", login);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a temporary password by email (public)
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Temporary password emailed
 *       400:
 *         description: Email missing
 *       403:
 *         description: Account is deactivated
 *       404:
 *         description: No account found with that email
 */
router.post("/forgot-password", forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using temporary password (first login)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tempPassword, newPassword]
 *             properties:
 *               tempPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Incorrect temporary password or invalid token
 */
router.post("/reset-password", protect, resetPassword);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get the current authenticated user (fresh role/status)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user
 *       401:
 *         description: Unauthorized / invalid session
 */
router.get("/me", protect, getMe);

module.exports = router;