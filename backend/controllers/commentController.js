// backend/controllers/commentController.js
// Handles comment operations: create and retrieve comments on tasks
// Member 2 (Subanya)

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// ════════ HELPER FUNCTION ═══════════════════════════════════════════════════
// Validates task ID, checks task exists, and verifies user permission
// Used by both createComment and getCommentsByTaskId to avoid duplication
// Returns: { task } on success, or sends error response
const validateTaskAccessAndGetTask = async (req, res, taskIdParam) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  // Validate task ID
  const taskId = parseInt(taskIdParam);
  if (isNaN(taskId)) {
    res.status(400).json({
      error: "Validation Error",
      message: "Task ID must be a valid number",
    });
    return null;
  }

  // Check if task exists
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignments: true,
    },
  });

  if (!task) {
    res.status(404).json({
      error: "Not Found",
      message: "Task not found",
    });
    return null;
  }

  // Permission check: Only PROJECT_MANAGER/ADMIN or assigned COLLABORATOR can access
  if (userRole === "COLLABORATOR") {
    const isAssigned = task.assignments.some((a) => a.userId === userId);
    if (!isAssigned) {
      res.status(403).json({
        error: "Forbidden",
        message: "You do not have access to this task",
      });
      return null;
    }
  }

  return task;
};

// ════════ POST /api/tasks/:id/comments ════════════════════════════════════
// Add a comment to a task
// Only assigned collaborators and project managers can comment
// Body: { content }
// Creates persistent notification + emits real-time Socket.io event
// Returns: { message, comment }
const createComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id; // From protect middleware
    const io = req.io; // Socket.io instance from server.js
    const connectedUsers = req.connectedUsers; // Connected users map

    // Validate content is provided and not empty
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Comment content is required",
      });
    }

    // Validate task access and get task
    const task = await validateTaskAccessAndGetTask(req, res, id);
    if (!task) return; // Error already sent by helper

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        taskId: task.id,
        userId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // ════════ Save persistent notifications + emit real-time events ═════
    // Send "comment_added" notification to all assigned users
    const assignedUserIds = task.assignments.map((a) => a.userId);
    const contentPreview = content.substring(0, 50);
    const notificationMessage = `New comment on "${task.title}": "${contentPreview}..."`;

    // Use for...of loop (not forEach) to properly await async operations
    for (const assignedUserId of assignedUserIds) {
      // Don't send notification to the person who just commented
      if (assignedUserId !== userId) {
        // Save notification to database (persistent)
        await prisma.notification.create({
          data: {
            message: notificationMessage,
            userId: assignedUserId,
            isRead: false,
          },
        });

        // Emit real-time Socket.io event if user is online
        if (io && connectedUsers[assignedUserId]) {
          io.to(connectedUsers[assignedUserId]).emit("comment_added", {
            message: notificationMessage,
            task: {
              id: task.id,
              title: task.title,
            },
            comment: {
              id: comment.id,
              content: comment.content,
              author: comment.user.name,
              authorId: comment.user.id,
            },
            timestamp: new Date(),
          });
        }
      }
    }
    console.log(`✅ Persistent notifications saved + real-time events sent: Comment added to task ${task.id}`);

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

    // Validate task access and get task (helper function handles all validation)
    const task = await validateTaskAccessAndGetTask(req, res, id);
    if (!task) return; // Error already sent by helper

    // Fetch all comments for this task
    const comments = await prisma.comment.findMany({
      where: { taskId: task.id },
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