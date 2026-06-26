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
  deleteUser,
} = require("../controllers/userController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// All user routes require a valid JWT
router.use(protect);

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
// Admins manage users; Project Managers need the roster to assign tasks.
// Collaborators do not — they cannot enumerate the user directory.
router.get("/", authorizeRoles("ADMIN", "PROJECT_MANAGER"), getAllUsers);

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
router.get("/:id", authorizeRoles("ADMIN", "PROJECT_MANAGER"), getUserById);

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
router.post("/", authorizeRoles("ADMIN"), createUser);

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
router.put("/:id", authorizeRoles("ADMIN"), updateUser);

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
router.patch("/:id/deactivate", authorizeRoles("ADMIN"), deactivateUser);

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
router.patch("/:id/activate", authorizeRoles("ADMIN"), activateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Permanently delete a user (Admin only — must be deactivated first)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User permanently deleted
 *       400:
 *         description: User is still active, or self-delete attempt
 *       404:
 *         description: User not found
 */
router.delete("/:id", authorizeRoles("ADMIN"), deleteUser);

module.exports = router;