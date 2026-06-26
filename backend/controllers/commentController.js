// backend/controllers/commentController.js
// Handles comment operations: create and retrieve comments on tasks
// Member 2 (Subanya)


const prisma = require("../lib/prisma");
const { notifyTaskParticipants, notifyAdmins } = require("../services/socketService");

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
      project: { select: { managerId: true } },
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
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    // ════════ Save persistent notifications + emit real-time events ═════
    // Notify all assigned users AND the project's manager (a PM should hear about
    // comments on tasks in their project even if they aren't assigned to the task).
    const recipientIds = new Set(task.assignments.map((a) => a.userId));
    if (task.project?.managerId) recipientIds.add(task.project.managerId);
    recipientIds.delete(userId); // never notify the commenter themselves

    const contentPreview = content.length > 50 ? content.substring(0, 50) + "..." : content;
    const projectName = task.project ? task.project.name : "Unassigned";
    const notificationMessage = `New comment on "${task.title}" (project: "${projectName}"): "${contentPreview}"`;

    // Use for...of loop (not forEach) to properly await async operations
    for (const assignedUserId of recipientIds) {
      {
        // Save notification to database (persistent)
        const dbNotification = await prisma.notification.create({
          data: {
            message: notificationMessage,
            userId: assignedUserId,
            isRead: false,
            taskId: task.id,
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

          // Emit general notification event
          io.to(connectedUsers[assignedUserId]).emit("notification", dbNotification);
        }
      }
    }

    // Notify all admins about the new comment (fire-and-forget)
    notifyAdmins(io, {
      message: notificationMessage,
      taskId: task.id,
      actorId: userId,
      event: "comment_added",
    }).catch((e) => console.error("Admin comment notification failed:", e.message));

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
          select: { id: true, name: true, email: true, role: true },
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

// ════════ PUT /api/tasks/comments/:commentId ══════════════════════════════
// Edit a comment
// Only the comment's author or ADMIN can edit
// Body: { content }
// Returns: { message, comment }
const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const id = parseInt(commentId);
    if (isNaN(id)) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Comment ID must be a valid number",
      });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Comment content is required",
      });
    }

    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return res.status(404).json({
        error: "Not Found",
        message: "Comment not found",
      });
    }

    if (comment.userId !== userId && userRole !== "ADMIN") {
      return res.status(403).json({
        error: "Forbidden",
        message: "You can only edit your own comments",
      });
    }

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: {
        content: content.trim(),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    // Notify the task's participants (assignees + project manager) that a comment
    // was edited. Fire-and-forget so a notification failure never breaks the edit.
    (async () => {
      try {
        const task = await prisma.task.findUnique({
          where: { id: comment.taskId },
          include: { assignments: true, project: { select: { id: true, name: true, managerId: true } } },
        });
        if (task) {
          const editProjectName = task.project ? task.project.name : "Unassigned";
          const editMessage = `A comment was edited on "${task.title}" (project: "${editProjectName}")`;

          await notifyTaskParticipants(req.io, req.connectedUsers, {
            taskId: task.id,
            assigneeIds: task.assignments.map((a) => a.userId),
            managerId: task.project?.managerId,
            actorId: userId,
            message: editMessage,
            event: "comment_added",
          });

          // Also notify admins
          await notifyAdmins(req.io, {
            message: editMessage,
            taskId: task.id,
            actorId: userId,
            event: "comment_added",
          });
        }
      } catch (e) {
        console.error("Comment-edit notification failed:", e.message);
      }
    })();

    return res.status(200).json({
      message: "Comment updated successfully",
      comment: updatedComment,
    });
  } catch (error) {
    console.error("Update comment error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to update comment",
    });
  }
};

// ════════ DELETE /api/tasks/comments/:commentId ═══════════════════════════
// Delete a comment
// Only the comment's author or ADMIN can delete
// Returns: { message }
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const id = parseInt(commentId);
    if (isNaN(id)) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Comment ID must be a valid number",
      });
    }

    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return res.status(404).json({
        error: "Not Found",
        message: "Comment not found",
      });
    }

    if (comment.userId !== userId && userRole !== "ADMIN") {
      return res.status(403).json({
        error: "Forbidden",
        message: "You can only delete your own comments",
      });
    }

    await prisma.comment.delete({
      where: { id },
    });

    return res.status(200).json({
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Delete comment error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to delete comment",
    });
  }
};

module.exports = {
  createComment,
  getCommentsByTaskId,
  updateComment,
  deleteComment,
};