// backend/tests/helpers/app.js
// Exports the Express app without starting the HTTP server.
// Supertest imports this and creates its own test server.

require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });

// Ensure JWT_SECRET is set for tests
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "test-secret-for-jest-only";
}

const express = require("express");
const authRoutes = require("../../routes/authRoutes");
const userRoutes = require("../../routes/userRoutes");
const taskRoutes = require("../../routes/taskRoutes");

const app = express();
app.use(express.json());

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);

// Generic error handler
app.use((err, _req, res, _next) => {
  res.status(500).json({ error: "Internal Server Error", message: err.message });
});

module.exports = app;
