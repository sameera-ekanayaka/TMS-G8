// backend/controllers/commentController.js
// Handles comment operations: create and retrieve comments on tasks
// Member 2 (Subanya)

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// ════════ POST /api/tasks/:id/comments ════════════════════════════════════
// Add a comment to a task
// Only assigned collaborators and project managers can comment
// Body: { content }
// Returns: { message, comment }
const createComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id; // From protect middleware
    const userRole = req.user.role;

    // Validate task ID
    const taskId = parseInt(id);
    if (isNaN(taskId)) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Task ID must be a valid number",
      });
    }

    // Validate content is provided and not empty
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Comment content is required",
      });
    }

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignments: true, // Get all assigned users
      },
    });

    if (!task) {
      return res.status(404).json({
        error: "Not Found",
        message: "Task not found",
      });
    }

    // Permission check: Only PROJECT_MANAGER/ADMIN or assigned COLLABORATOR can comment
    if (userRole === "COLLABORATOR") {
      const isAssigned = task.assignments.some((a) => a.userId === userId);
      if (!isAssigned) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You can only comment on tasks assigned to you",
        });
      }
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        taskId,
        userId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return res.status(201).json({
      message: "Comment added successfully",
      comment,
    });
  } catch (error) {
    console.error("Create comment error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to add comment",
    });
  }
};

// ════════ GET /api/tasks/:id/comments ═══════════════════════════════════════
// Get all comments for a task
// Only assigned users and project managers can view comments
// Returns: { comments }
const getCommentsByTaskId = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validate task ID
    const taskId = parseInt(id);
    if (isNaN(taskId)) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Task ID must be a valid number",
      });
    }

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignments: true,
      },
    });

    if (!task) {
      return res.status(404).json({
        error: "Not Found",
        message: "Task not found",
      });
    }

    // Permission check: Only PROJECT_MANAGER/ADMIN or assigned COLLABORATOR can view comments
    if (userRole === "COLLABORATOR") {
      const isAssigned = task.assignments.some((a) => a.userId === userId);
      if (!isAssigned) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You can only view comments on tasks assigned to you",
        });
      }
    }

    // Fetch all comments for this task
    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "asc" }, // Oldest first
    });

    return res.status(200).json({
      comments,
    });
  } catch (error) {
    console.error("Get comments error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch comments",
    });
  }
};

module.exports = {
  createComment,
  getCommentsByTaskId,
};