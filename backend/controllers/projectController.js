// backend/controllers/projectController.js
// CRUD operations for the Project entity, with manager assignment support
// Member 1 (Sameera)

const prisma = require("../lib/prisma");
const xss = require("xss");
const { sendUserNotification } = require("../services/socketService");

// ════════ POST /api/projects ═════════════════════════════════════════════════
// Create a new project
// Body: { name, description, managerId }
const createProject = async (req, res) => {
  try {
    let { name, description, managerId } = req.body;
    if (name) name = xss(name);
    if (description) description = xss(description);

    if (!name || name.trim() === "") {
      return res.status(400).json({
        error: "Validation Error",
        message: "Project name is required",
      });
    }

    let parsedManagerId = null;
    if (managerId !== undefined && managerId !== null) {
      parsedManagerId = parseInt(managerId, 10);
      if (isNaN(parsedManagerId)) {
        return res.status(400).json({
          error: "Validation Error",
          message: "Invalid manager ID format",
        });
      }

      // Verify user exists before assigning as manager
      const managerUser = await prisma.user.findUnique({
        where: { id: parsedManagerId },
      });

      if (!managerUser) {
        return res.status(404).json({
          error: "Not Found",
          message: "Assigned manager user not found",
        });
      }

      if (!managerUser.isActive) {
        return res.status(400).json({
          error: "Validation Error",
          message: "Cannot assign a deactivated user as project manager.",
        });
      }
    }

    // Smart Manager Default:
    // If managerId is not provided (parsedManagerId is null), but the request user
    // is a PROJECT_MANAGER, default it to their own user ID.
    if (parsedManagerId === null && req.user.role === "PROJECT_MANAGER") {
      parsedManagerId = req.user.id;
    }

    const newProject = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        managerId: parsedManagerId,
      },
      include: {
        tasks: true,
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Administrative update: notify the assigned manager (unless they assigned
    // themselves). Fire-and-forget so it never blocks project creation.
    if (parsedManagerId && parsedManagerId !== req.user.id) {
      sendUserNotification(
        req.io,
        req.connectedUsers,
        parsedManagerId,
        `You were assigned as manager of project "${newProject.name}".`
      ).catch((e) => console.error("Manager-assignment notification failed:", e.message));
    }

    return res.status(201).json({
      message: "Project created successfully",
      project: newProject,
    });
  } catch (error) {
    console.error("Create project error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to create project",
    });
  }
};

// ════════ GET /api/projects ══════════════════════════════════════════════════
// Get all projects
const getProjects = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;

    const where = {};
    if (userRole === "PROJECT_MANAGER") {
      where.managerId = userId;
    } else if (userRole === "COLLABORATOR") {
      where.tasks = {
        some: {
          assignments: {
            some: {
              userId: userId,
            },
          },
        },
      };
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        tasks: {
          include: {
            assignments: {
              include: { user: { select: { id: true, name: true } } }
            }
          }
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({ projects });
  } catch (error) {
    console.error("Get projects error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch projects",
    });
  }
};

// ════════ GET /api/projects/:id ══════════════════════════════════════════════
// Get project by ID
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        tasks: {
          include: {
            assignments: {
              include: { user: { select: { id: true, name: true } } }
            }
          }
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        error: "Not Found",
        message: "Project not found",
      });
    }

    return res.status(200).json({ project });
  } catch (error) {
    console.error("Get project by ID error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch project",
    });
  }
};

// ════════ PUT /api/projects/:id ══════════════════════════════════════════════
// Update a project
// Body: { name, description, managerId }
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    let { name, description, managerId } = req.body;
    if (name) name = xss(name);
    if (description) description = xss(description);

    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return res.status(404).json({
        error: "Not Found",
        message: "Project not found",
      });
    }

    if (name !== undefined && name.trim() === "") {
      return res.status(400).json({
        error: "Validation Error",
        message: "Project name cannot be empty",
      });
    }

    let parsedManagerId = undefined;
    if (managerId !== undefined) {
      if (managerId === null) {
        parsedManagerId = null;
      } else {
        parsedManagerId = parseInt(managerId, 10);
        if (isNaN(parsedManagerId)) {
          return res.status(400).json({
            error: "Validation Error",
            message: "Invalid manager ID format",
          });
        }

        // Verify user exists before assigning as manager
        const managerUser = await prisma.user.findUnique({
          where: { id: parsedManagerId },
        });

        if (!managerUser) {
          return res.status(404).json({
            error: "Not Found",
            message: "Assigned manager user not found",
          });
        }

        if (!managerUser.isActive) {
          return res.status(400).json({
            error: "Validation Error",
            message: "Cannot assign a deactivated user as project manager.",
          });
        }
      }
    }

    const updatedData = {};
    if (name !== undefined) updatedData.name = name.trim();
    if (description !== undefined) updatedData.description = description ? description.trim() : null;
    if (parsedManagerId !== undefined) updatedData.managerId = parsedManagerId;

    const updatedProject = await prisma.project.update({
      where: { id },
      data: updatedData,
      include: {
        tasks: true,
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Administrative update: notify a newly-assigned manager (changed, not self).
    if (
      parsedManagerId &&
      parsedManagerId !== existingProject.managerId &&
      parsedManagerId !== req.user.id
    ) {
      sendUserNotification(
        req.io,
        req.connectedUsers,
        parsedManagerId,
        `You were assigned as manager of project "${updatedProject.name}".`
      ).catch((e) => console.error("Manager-assignment notification failed:", e.message));
    }

    return res.status(200).json({
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    console.error("Update project error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to update project",
    });
  }
};

// ════════ DELETE /api/projects/:id ═══════════════════════════════════════════
// Delete a project
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return res.status(404).json({
        error: "Not Found",
        message: "Project not found",
      });
    }

    await prisma.project.delete({
      where: { id },
    });

    return res.status(200).json({
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to delete project",
    });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
