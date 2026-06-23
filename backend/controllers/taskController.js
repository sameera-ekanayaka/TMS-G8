// backend/controllers/taskController.js
// Handles task CRUD operations with real-time Socket.io notifications
// Member 2 (Subanya)

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// ════════ POST /api/tasks ════════════════════════════════════════════════════
// Create a new task
// Only PROJECT_MANAGER can create tasks
// Body: { title, description, priority, dueDate }
// Returns: { message, task }
const createTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate, assignedUserId } = req.body;
    const userId = req.user.id; // From protect middleware

    // Validate required fields
    if (!title) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Task title is required",
      });
    }

    // Validate priority if provided (must be LOW, MEDIUM, or HIGH)
    if (priority && !["LOW", "MEDIUM", "HIGH"].includes(priority)) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Priority must be LOW, MEDIUM, or HIGH",
      });
    }

    // Validate due date if provided (must not be in the past)
    if (dueDate) {
      const dueDateObj = new Date(dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dueDateObj < today) {
        return res.status(400).json({
          error: "Validation Error",
          message: "Due date cannot be in the past",
        });
      }
    }

    // Validate assigned user if provided
    if (assignedUserId && assignedUserId !== "") {
      const parsedAssignedUserId = parseInt(assignedUserId);
      if (isNaN(parsedAssignedUserId) || parsedAssignedUserId <= 0) {
        return res.status(400).json({
          error: "Validation Error",
          message: "assignedUserId must be a valid positive number",
        });
      }
      const userExists = await prisma.user.findUnique({ where: { id: parsedAssignedUserId } });
      if (!userExists) {
        return res.status(404).json({
          error: "Not Found",
          message: "Assigned user not found",
        });
      }
      if (!userExists.isActive) {
        return res.status(400).json({
          error: "Validation Error",
          message: "Cannot assign task to a deactivated user",
        });
      }
    }

    // Create the task with defaults: status=TODO, priority=MEDIUM if not provided
    const newTask = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        priority: priority || "MEDIUM",
        status: "TODO",
        dueDate: dueDate ? new Date(dueDate) : null,
        createdById: userId,
        assignments: assignedUserId ? {
          create: {
            userId: parseInt(assignedUserId)
          }
        } : undefined
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        assignments: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        comments: true,
      },
    });

    const io = req.io;
    if (io) {
      io.emit("taskCreated", newTask);
    }

    return res.status(201).json({
      message: "Task created successfully",
      task: newTask,
    });
  } catch (error) {
    console.error("Create task error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to create task",
    });
  }
};

// ════════ GET /api/tasks ════════════════════════════════════════════════════
// Get all tasks (filtered by user role)
// PROJECT_MANAGER: sees all tasks
// COLLABORATOR: sees only assigned tasks
// Returns: { tasks }
const getTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { status, priority, sortBy, order } = req.query;

    // Build filter object from query params
    const filters = {};
    if (status && ["TODO", "IN_PROGRESS", "COMPLETED"].includes(status)) {
      filters.status = status;
    }
    if (priority && ["LOW", "MEDIUM", "HIGH"].includes(priority)) {
      filters.priority = priority;
    }

    // Build sort object from query params
    const validSortFields = ["createdAt", "dueDate", "priority", "status"];
    const sortField = sortBy && validSortFields.includes(sortBy) ? sortBy : "createdAt";
    const sortOrder = order === "asc" ? "asc" : "desc";
    const orderBy = { [sortField]: sortOrder };

    // Common include block
    const includeBlock = {
      createdBy: {
        select: { id: true, name: true, email: true, role: true },
      },
      assignments: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      comments: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    };

    let tasks;

    if (userRole === "PROJECT_MANAGER" || userRole === "ADMIN") {
      tasks = await prisma.task.findMany({
        where: filters,
        include: includeBlock,
        orderBy,
      });
    } else {
      tasks = await prisma.task.findMany({
        where: {
          ...filters,
          assignments: {
            some: { userId },
          },
        },
        include: includeBlock,
        orderBy,
      });
    }

    return res.status(200).json({ tasks });
  } catch (error) {
    console.error("Get tasks error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch tasks",
    });
  }
};

// ════════ GET /api/tasks/:id ════════════════════════════════════════════════
// Get a single task by ID
// Returns: { task }
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validate task ID is a number
    const taskId = parseInt(id);
    if (isNaN(taskId)) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Task ID must be a valid number",
      });
    }

    // Fetch the task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        assignments: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        comments: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    // Task not found
    if (!task) {
      return res.status(404).json({
        error: "Not Found",
        message: "Task not found",
      });
    }

    // Permission check: Collaborators can only see tasks assigned to them
    if (userRole === "COLLABORATOR") {
      const isAssigned = task.assignments.some((a) => a.userId === userId);
      if (!isAssigned) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You do not have access to this task",
        });
      }
    }

    return res.status(200).json({
      task,
    });
  } catch (error) {
    console.error("Get task by ID error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch task",
    });
  }
};

// ════════ PUT /api/tasks/:id ════════════════════════════════════════════════
// Update a task
// Only PROJECT_MANAGER can update tasks
// Body: { title, description, priority, dueDate }
// Returns: { message, task }
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, dueDate, assignedUserId } = req.body;

    // Validate task ID
    const taskId = parseInt(id);
    if (isNaN(taskId)) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Task ID must be a valid number",
      });
    }

    // Check if task exists
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      return res.status(404).json({
        error: "Not Found",
        message: "Task not found",
      });
    }

    // Validate priority if provided
    if (priority && !["LOW", "MEDIUM", "HIGH"].includes(priority)) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Priority must be LOW, MEDIUM, or HIGH",
      });
    }

    // Validate due date if it's being changed to a new value
    if (dueDate) {
      const dueDateObj = new Date(dueDate);
      const existingDueDate = task.dueDate ? new Date(task.dueDate) : null;
      const isDateChanging = !existingDueDate || dueDateObj.getTime() !== existingDueDate.getTime();

      if (isDateChanging) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (dueDateObj < today) {
          return res.status(400).json({
            error: "Validation Error",
            message: "Due date cannot be in the past",
          });
        }
      }
    }

    // Validate assigned user if provided
    if (assignedUserId !== undefined && assignedUserId !== null && assignedUserId !== "") {
      const parsedAssignedUserId = parseInt(assignedUserId);
      if (isNaN(parsedAssignedUserId) || parsedAssignedUserId <= 0) {
        return res.status(400).json({
          error: "Validation Error",
          message: "assignedUserId must be a valid positive number",
        });
      }
      const userExists = await prisma.user.findUnique({ where: { id: parsedAssignedUserId } });
      if (!userExists) {
        return res.status(404).json({
          error: "Not Found",
          message: "Assigned user not found",
        });
      }
      if (!userExists.isActive) {
        return res.status(400).json({
          error: "Validation Error",
          message: "Cannot assign task to a deactivated user",
        });
      }
    }

    // Handle assignment if assignedUserId is provided
    let assignmentsUpdate = undefined;
    if (assignedUserId !== undefined) {
      // Clear existing assignments for this task
      await prisma.taskAssignment.deleteMany({
        where: { taskId },
      });

      if (assignedUserId && assignedUserId !== "") {
        const parsedAssignedUserId = parseInt(assignedUserId);
        if (!isNaN(parsedAssignedUserId) && parsedAssignedUserId > 0) {
          assignmentsUpdate = {
            create: {
              userId: parsedAssignedUserId,
            },
          };
        }
      }
    }

    // Update the task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: title ? title.trim() : undefined,
        description: description ? description.trim() : undefined,
        priority: priority || undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        assignments: assignmentsUpdate,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        assignments: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        comments: true,
      },
    });

    const io = req.io;
    if (io) {
      io.emit("taskUpdated", updatedTask);
    }

    return res.status(200).json({
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Update task error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to update task",
    });
  }
};

// ════════ DELETE /api/tasks/:id ═════════════════════════════════════════════
// Delete a task
// Only PROJECT_MANAGER can delete tasks
// Returns: { message }
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate task ID
    const taskId = parseInt(id);
    if (isNaN(taskId)) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Task ID must be a valid number",
      });
    }

    // Check if task exists
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      return res.status(404).json({
        error: "Not Found",
        message: "Task not found",
      });
    }

    // Delete the task (Prisma cascade delete handles assignments & comments)
    await prisma.task.delete({ where: { id: taskId } });

    const io = req.io;
    if (io) {
      io.emit("taskDeleted", taskId);
    }

    return res.status(200).json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to delete task",
    });
  }
};

// ════════ POST /api/tasks/:id/assign ════════════════════════════════════════
// Assign a task to a user
// Only PROJECT_MANAGER can assign tasks
// Body: { userId }
// Creates persistent notification + emits real-time Socket.io event
// Returns: { message, assignment }
const assignTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(req.body.userId);
    const io = req.io; // Socket.io instance from server.js
    const connectedUsers = req.connectedUsers; // Connected users map from server.js

    // ════════ Validate userId: consolidated check (no dead code) ════════
    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({
        error: "Validation Error",
        message: "userId must be a valid positive number",
      });
    }

    // Validate task ID
    const taskId = parseInt(id);
    if (isNaN(taskId)) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Task ID must be a valid number",
      });
    }

    // Check if task exists
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      return res.status(404).json({
        error: "Not Found",
        message: "Task not found",
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({
        error: "Not Found",
        message: "User not found",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Cannot assign task to deactivated user",
      });
    }

    // Check if already assigned (unique constraint)
    const existingAssignment = await prisma.taskAssignment.findUnique({
      where: { taskId_userId: { taskId, userId } },
    });

    if (existingAssignment) {
      return res.status(400).json({
        error: "Validation Error",
        message: "This task is already assigned to this user",
      });
    }

    // Create the assignment
    const assignment = await prisma.taskAssignment.create({
      data: {
        taskId,
        userId,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        task: { select: { id: true, title: true } },
      },
    });

    // ════════ Save notification to database (persistent) ════════════════
    // This ensures offline users will see the notification when they return
    const notificationMessage = `You have been assigned a new task: "${task.title}"`;
    const dbNotification = await prisma.notification.create({
      data: {
        message: notificationMessage,
        userId,
        isRead: false,
      },
    });
    console.log(`✅ Persistent notification saved to DB for user ${userId}`);

    // ════════ Emit Socket.io Real-Time Notification (if online) ═════════
    // Send notification to the assigned user if they're currently connected
    if (io && connectedUsers[userId]) {
      io.to(connectedUsers[userId]).emit("task_assigned", {
        message: notificationMessage,
        task: {
          id: task.id,
          title: task.title,
          priority: task.priority,
          dueDate: task.dueDate,
        },
        timestamp: new Date(),
      });
      // Emit general notification event
      io.to(connectedUsers[userId]).emit("notification", dbNotification);
      console.log(`✅ Real-time notification sent to user ${userId}: Task assigned`);
    } else {
      console.log(
        `⚠️ User ${userId} is offline. Persistent notification saved; real-time will be sent when they reconnect.`
      );
    }

    return res.status(201).json({
      message: "Task assigned successfully",
      assignment,
    });
  } catch (error) {
    console.error("Assign task error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to assign task",
    });
  }
};

// ════════ PUT /api/tasks/:id/status ════════════════════════════════════════
// Update task status
// Can be done by PROJECT_MANAGER or assigned COLLABORATOR
// Body: { status }
// Creates persistent notifications + emits real-time Socket.io events
// Status must be: TODO, IN_PROGRESS, or COMPLETED
// Returns: { message, task }
const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    const io = req.io; // Socket.io instance from server.js
    const connectedUsers = req.connectedUsers; // Connected users map from server.js

    // Validate task ID
    const taskId = parseInt(id);
    if (isNaN(taskId)) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Task ID must be a valid number",
      });
    }

    // Validate status
    if (!status || !["TODO", "IN_PROGRESS", "COMPLETED"].includes(status)) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Status must be TODO, IN_PROGRESS, or COMPLETED",
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

    // Permission check: Collaborators can only update status of assigned tasks
    if (userRole === "COLLABORATOR") {
      const isAssigned = task.assignments.some((a) => a.userId === userId);
      if (!isAssigned) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You can only update status of tasks assigned to you",
        });
      }
    }

    // Update the status
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        assignments: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        comments: true,
      },
    });

    // ════════ Save notifications to database + emit real-time events ═════
    // Use for...of loop (not forEach) to properly await async operations
    const assignedUserIds = updatedTask.assignments.map((a) => a.userId);
    const notificationMessage = `Task "${updatedTask.title}" status changed to ${updatedTask.status}`;

    for (const assignedUserId of assignedUserIds) {
      // Save notification to database (persistent)
      const dbNotification = await prisma.notification.create({
        data: {
          message: notificationMessage,
          userId: assignedUserId,
          isRead: false,
        },
      });

      // Emit real-time Socket.io event if user is online
      if (io && connectedUsers[assignedUserId]) {
        io.to(connectedUsers[assignedUserId]).emit("task_status_changed", {
          message: notificationMessage,
          task: {
            id: updatedTask.id,
            title: updatedTask.title,
            status: updatedTask.status,
            priority: updatedTask.priority,
          },
          timestamp: new Date(),
        });
        // Emit general notification event
        io.to(connectedUsers[assignedUserId]).emit("notification", dbNotification);
      }
    }
    console.log(
      `✅ Persistent notifications saved + real-time events sent: Task ${taskId} status changed to ${status}`
    );

    if (io) {
      io.emit("task_status_changed", {
        taskId: updatedTask.id,
        newStatus: updatedTask.status,
        task: updatedTask,
      });
    }

    return res.status(200).json({
      message: "Task status updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Update task status error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to update task status",
    });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  assignTask,
  updateTaskStatus,
};