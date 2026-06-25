require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const commentRoutes = require("./routes/commentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const attachmentRoutes = require("./routes/attachmentRoutes");
const projectRoutes = require("./routes/projectRoutes");

const app = express();
app.set("trust proxy", 1);
const httpServer = http.createServer(app);
const jwt = require("jsonwebtoken");

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || (process.env.NODE_ENV === "production" ? "https://tms-frontend.kindpebble-85fc4cff.centralindia.azurecontainerapps.io" : "http://localhost:5173"),
    methods: ["GET", "POST"],
  },
});

// Initialize Socket.io service
const { initializeSocket } = require("./services/socketService");
const { initializeDeadlineScheduler } = require("./services/deadlineService");
const taskController = require("./controllers/taskController");

// Initialize Socket.io connections
initializeSocket(io);

// connectedUsers maps userId -> socket.id for targeted notifications
const connectedUsers = {};

// ── Socket.io auth middleware ──────────────────────────────
// Verifies the JWT sent by the client before allowing the connection,
// and attaches the verified userId to the socket. Replaces trusting
// a client-emitted "register" event, which let anyone claim any userId.
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication error: no token provided"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_tms_g8_2024");
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    next();
  } catch (err) {
    next(new Error("Authentication error: invalid or expired token"));
  }
});

io.on("connection", (socket) => {
  connectedUsers[socket.userId] = socket.id;

  // personal room per user + a shared "managers" room, so task events go to
  // managers and the task's assignees only, not to everyone
  socket.join(`user:${socket.userId}`);
  if (socket.userRole === "ADMIN" || socket.userRole === "PROJECT_MANAGER") {
    socket.join("managers");
  }
  console.log(`User ${socket.userId} connected with socket ${socket.id}`);

  socket.on("disconnect", () => {
    if (connectedUsers[socket.userId] === socket.id) {
      delete connectedUsers[socket.userId];
    }
    console.log(`User ${socket.userId} disconnected`);
  });
});

// Initialize deadline notification scheduler
  initializeDeadlineScheduler(io, connectedUsers);

// Attach io and connectedUsers to every request so controllers can emit
app.use((req, _res, next) => {
  req.io = io;
  req.connectedUsers = connectedUsers;
  next();
});

// security headers. allow cross-origin so the frontend can load /uploads files
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(cors({ origin: process.env.CLIENT_URL || (process.env.NODE_ENV === "production" ? "https://tms-frontend.kindpebble-85fc4cff.centralindia.azurecontainerapps.io" : "http://localhost:5173"), credentials: true }));
app.use(express.json());
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// limit auth attempts to slow down brute force / credential stuffing
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too Many Requests",
    message: "Too many attempts from this IP. Please try again later.",
  },
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/tasks", commentRoutes);
app.use("/api/tasks", attachmentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/projects", projectRoutes);

app.get("/", (_req, res) => {
  res.json({ message: "TMS API is running", docs: "/api-docs" });
});

// Health check endpoint — used by Docker HEALTHCHECK and Azure Container Apps liveness probe
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
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
