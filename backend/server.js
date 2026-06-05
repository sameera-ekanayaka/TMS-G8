require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Initialize Socket.io service
const { initializeSocket, setIO } = require("./services/socketService");
const taskController = require("./controllers/taskController");

// Initialize Socket.io connections
initializeSocket(io);

// connectedUsers maps userId -> socket.id for targeted notifications
const connectedUsers = {};

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("register", (userId) => {
    connectedUsers[userId] = socket.id;
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  socket.on("disconnect", () => {
    for (const [userId, sid] of Object.entries(connectedUsers)) {
      if (sid === socket.id) {
        delete connectedUsers[userId];
        break;
      }
    }
  });
});

// Attach io and connectedUsers to every request so controllers can emit
app.use((req, _res, next) => {
  req.io = io;
  req.connectedUsers = connectedUsers;
  next();
});

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (_req, res) => {
  res.json({ message: "TMS API is running", docs: "/api-docs" });
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not Found", message: "Route does not exist" });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error", message: "Something went wrong" });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Swagger docs at http://localhost:${PORT}/api-docs`);
});

module.exports = { app, io, connectedUsers };
