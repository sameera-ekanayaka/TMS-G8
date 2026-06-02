// backend/routes/userRoutes.js
// All routes protected — Admin only
// Member 1 (Sameera)

const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
  activateUser,
} = require("../controllers/userController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// All user routes require a valid JWT + ADMIN role
router.use(protect);
router.use(authorizeRoles("ADMIN"));

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management — Admin only
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of all users
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (Admin only)
 */
router.get("/", getAllUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get a single user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 */
router.get("/:id", getUserById);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user (sends onboarding email with temp password)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, role]
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               role:
 *                 type: string
 *                 enum: [ADMIN, PROJECT_MANAGER, COLLABORATOR]
 *     responses:
 *       201:
 *         description: User created, onboarding email sent
 *       400:
 *         description: Validation error or email already exists
 */
router.post("/", createUser);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update a user's name, email, or role
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, PROJECT_MANAGER, COLLABORATOR]
 *     responses:
 *       200:
 *         description: User updated
 *       404:
 *         description: User not found
 */
router.put("/:id", updateUser);

/**
 * @swagger
 * /api/users/{id}/deactivate:
 *   patch:
 *     summary: Deactivate a user account (soft delete)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deactivated
 *       400:
 *         description: Already deactivated or self-deactivation attempt
 *       404:
 *         description: User not found
 */
router.patch("/:id/deactivate", deactivateUser);

/**
 * @swagger
 * /api/users/{id}/activate:
 *   patch:
 *     summary: Re-activate a deactivated user account
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User activated
 *       400:
 *         description: Already active
 *       404:
 *         description: User not found
 */
router.patch("/:id/activate", activateUser);

module.exports = router;