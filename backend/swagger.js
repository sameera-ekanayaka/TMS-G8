const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Task Management System API",
      version: "1.0.0",
      description: "REST API for TMS — INTE 21323 Group Assignment",
    },
    servers: [
      {
        url: process.env.BACKEND_URL || "/",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            error: { type: "string", example: "Validation Error" },
            message: { type: "string", example: "Detailed explanation of the error." },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            name: { type: "string", example: "John Doe" },
            email: { type: "string", example: "john@example.com" },
            role: { type: "string", enum: ["ADMIN", "PROJECT_MANAGER", "COLLABORATOR"], example: "COLLABORATOR" },
            isActive: { type: "boolean", example: true },
            mustResetPassword: { type: "boolean", example: false },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Project: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid", example: "a8b9c0d1-e2f3-4a5b-6c7d-8e9f0a1b2c3d" },
            name: { type: "string", example: "TMS Redesign" },
            description: { type: "string", nullable: true, example: "Overhaul the task management system" },
            managerId: { type: "integer", nullable: true, example: 2 },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Task: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            title: { type: "string", example: "Implement user authentication" },
            description: { type: "string", nullable: true },
            priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"], example: "MEDIUM" },
            status: { type: "string", enum: ["TODO", "IN_PROGRESS", "COMPLETED"], example: "TODO" },
            dueDate: { type: "string", format: "date-time", nullable: true },
            projectId: { type: "string", format: "uuid", nullable: true },
            createdById: { type: "integer", example: 1 },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Comment: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            content: { type: "string", example: "This task needs more clarification" },
            taskId: { type: "integer", example: 1 },
            userId: { type: "integer", example: 2 },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Attachment: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            filename: { type: "string", example: "report.pdf" },
            storedAs: { type: "string", example: "a1b2c3-report.pdf" },
            mimeType: { type: "string", example: "application/pdf" },
            size: { type: "integer", example: 204800 },
            taskId: { type: "integer", example: 1 },
            userId: { type: "integer", example: 2 },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Notification: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            message: { type: "string", example: "You have been assigned a new task" },
            isRead: { type: "boolean", example: false },
            userId: { type: "integer", example: 2 },
            taskId: { type: "integer", nullable: true, example: 1 },
            createdAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./routes/*.js"],
};

module.exports = swaggerJsdoc(options);
