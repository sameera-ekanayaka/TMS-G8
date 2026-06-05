// backend/controllers/taskController.js
// Handles task CRUD operations: create, read, update, delete, assign
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
    const { title, description, priority, dueDate } = req.body;
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
      today.setHours(0, 0, 0, 0); // Set to start of today for fair comparison

      if (dueDateObj < today) {
        return res.status(400).json({
          error: "Validation Error",
          message: "Due date cannot be in the past",
        });
      }
    }

    // Create the task with defaults: status=TODO, priority=MEDIUM if not provided
    const newTask = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        priority: priority || "MEDIUM",
        status: "TODO", // Default status
        dueDate: dueDate ? new Date(dueDate) : null,
        createdById: userId,
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

    let tasks;

    if (userRole === "PROJECT_MANAGER" || userRole === "ADMIN") {
      // Project Managers and Admins see all tasks
      tasks = await prisma.task.findMany({
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
        orderBy: { createdAt: "desc" }, // Most recent first
      });
    } else {
      // Collaborators see only tasks assigned to them
      tasks = await prisma.task.findMany({
        where: {
          assignments: {
            some: {
              userId: userId,
            },
          },
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
          comments: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return res.status(200).json({
      tasks,
    });
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
    const { title, description, priority, dueDate } = req.body;

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

    // Validate due date if provided
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

    // Prepare update data (only update fields that are provided)
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

    // Update the task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
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

// ════════ DELETE /api/tasks/:id ════════════════════════════════════════════
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
// Returns: { message, assignment }
const assignTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    // Validate task ID
    const taskId = parseInt(id);
    if (isNaN(taskId)) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Task ID must be a valid number",
      });
    }

    // Validate userId is provided
    if (!userId) {
      return res.status(400).json({
        error: "Validation Error",
        message: "User ID is required",
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
// Update task status (can be done by PROJECT_MANAGER or assigned COLLABORATOR)
// Body: { status }
// Status must be: TODO, IN_PROGRESS, or COMPLETED
// Returns: { message, task }
const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
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
