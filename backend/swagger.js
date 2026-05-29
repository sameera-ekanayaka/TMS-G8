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
        url: process.env.NODE_ENV === "production"
          ? "https://your-backend.onrender.com"
          : "http://localhost:5000",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./routes/*.js"],
};

module.exports = swaggerJsdoc(options);
