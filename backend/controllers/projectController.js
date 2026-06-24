// backend/controllers/projectController.js
// Basic CRUD operations for the Project entity
// Member 1 (Sameera)

const prisma = require("../lib/prisma");

// ════════ POST /api/projects ═════════════════════════════════════════════════
// Create a new project
// Body: { name, description }
const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        error: "Validation Error",
        message: "Project name is required",
      });
    }

    const newProject = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
      },
    });

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
    const projects = await prisma.project.findMany({
      include: {
        tasks: true,
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
        tasks: true,
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
// Body: { name, description }
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

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

    const updatedData = {};
    if (name !== undefined) updatedData.name = name.trim();
    if (description !== undefined) updatedData.description = description ? description.trim() : null;

    const updatedProject = await prisma.project.update({
      where: { id },
      data: updatedData,
    });

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
