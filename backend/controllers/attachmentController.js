// backend/controllers/attachmentController.js
const path = require("path");
const fs = require("fs");

const prisma = require("../lib/prisma");

// POST /api/tasks/:id/attachments
const uploadAttachment = async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;

    if (isNaN(taskId)) {
      return res.status(400).json({ error: "Validation Error", message: "Invalid task ID" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Validation Error", message: "No file uploaded" });
    }

    // Check task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignments: true },
    });

    if (!task) {
      return res.status(404).json({ error: "Not Found", message: "Task not found" });
    }

    // Collaborators can only attach to assigned tasks
    if (userRole === "COLLABORATOR") {
      const isAssigned = task.assignments.some((a) => a.userId === userId);
      if (!isAssigned) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You can only attach files to tasks assigned to you",
        });
      }
    }

    const attachment = await prisma.attachment.create({
      data: {
        filename: req.file.originalname,
        storedAs: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        taskId,
        userId,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return res.status(201).json({
      message: "File uploaded successfully",
      attachment,
    });
  } catch (error) {
    console.error("Upload attachment error:", error);
    return res.status(500).json({ error: "Internal Server Error", message: "Upload failed" });
  }
};

// GET /api/tasks/:id/attachments
const getAttachments = async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;

    if (isNaN(taskId)) {
      return res.status(400).json({ error: "Validation Error", message: "Invalid task ID" });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignments: true },
    });

    if (!task) {
      return res.status(404).json({ error: "Not Found", message: "Task not found" });
    }

    if (userRole === "COLLABORATOR") {
      const isAssigned = task.assignments.some((a) => a.userId === userId);
      if (!isAssigned) {
        return res.status(403).json({ error: "Forbidden", message: "Access denied" });
      }
    }

    const attachments = await prisma.attachment.findMany({
      where: { taskId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ attachments });
  } catch (error) {
    console.error("Get attachments error:", error);
    return res.status(500).json({ error: "Internal Server Error", message: "Failed to fetch attachments" });
  }
};

module.exports = { uploadAttachment, getAttachments };