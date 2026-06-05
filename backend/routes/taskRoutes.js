// backend/routes/taskRoutes.js
// Task management endpoints with role-based access control
// Member 2 (Subanya)

const express = require("express");
const router = express.Router();
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  assignTask,
  updateTaskStatus,
} = require("../controllers/taskController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management endpoints
 */

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Implement user authentication"
 *               description:
 *                 type: string
 *                 example: "Set up JWT-based authentication for the system"
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *                 example: "HIGH"
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-06-15"
 *     responses:
 *       201:
 *         description: Task created successfully
 *       400:
 *         description: Validation error (missing title, invalid priority, past due date)
 *       401:
 *         description: Unauthorized - no valid token
 *       403:
 *         description: Forbidden - only PROJECT_MANAGER can create tasks
 *       500:
 *         description: Internal server error
 */
router.post(
  "/",
  protect,
  authorizeRoles("PROJECT_MANAGER", "ADMIN"),
  createTask
);

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks (filtered by user role)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tasks:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized - no valid token
 *       500:
 *         description: Internal server error
 */
router.get("/", protect, getTasks);

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get a single task by ID
 *     tags: [Tasks]
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
 *         description: Task details
 *       400:
 *         description: Invalid task ID
 *       401:
 *         description: Unauthorized - no valid token
 *       403:
 *         description: Forbidden - collaborators can only see assigned tasks
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", protect, getTaskById);

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update a task
 *     tags: [Tasks]
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
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - no valid token
 *       403:
 *         description: Forbidden - only PROJECT_MANAGER can update tasks
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */
router.put(
  "/:id",
  protect,
  authorizeRoles("PROJECT_MANAGER", "ADMIN"),
  updateTask
);

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
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
 *         description: Task deleted successfully
 *       400:
 *         description: Invalid task ID
 *       401:
 *         description: Unauthorized - no valid token
 *       403:
 *         description: Forbidden - only PROJECT_MANAGER can delete tasks
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  "/:id",
  protect,
  authorizeRoles("PROJECT_MANAGER", "ADMIN"),
  deleteTask
);

/**
 * @swagger
 * /api/tasks/{id}/assign:
 *   post:
 *     summary: Assign a task to a user
 *     tags: [Tasks]
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
 *             required: [userId]
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: Task assigned successfully
 *       400:
 *         description: Validation error (missing userId, user inactive, already assigned)
 *       401:
 *         description: Unauthorized - no valid token
 *       403:
 *         description: Forbidden - only PROJECT_MANAGER can assign tasks
 *       404:
 *         description: Task or user not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/:id/assign",
  protect,
  authorizeRoles("PROJECT_MANAGER", "ADMIN"),
  assignTask
);

/**
 * @swagger
 * /api/tasks/{id}/status:
 *   put:
 *     summary: Update task status (PROJECT_MANAGER or assigned COLLABORATOR)
 *     tags: [Tasks]
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, COMPLETED]
 *                 example: "IN_PROGRESS"
 *     responses:
 *       200:
 *         description: Task status updated successfully
 *       400:
 *         description: Validation error (invalid status)
 *       401:
 *         description: Unauthorized - no valid token
 *       403:
 *         description: Forbidden - can only update assigned tasks
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id/status", protect, updateTaskStatus);

module.exports = router;
