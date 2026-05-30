// backend/middleware/authMiddleware.js
// Two middleware functions used on every protected route:
//   protect        — verifies the JWT and attaches req.user
//   authorizeRoles — checks req.user.role against allowed roles
// Member 1 (Sameera)

const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// ─── protect ─────────────────────────────────────────────────
// Usage: router.get('/route', protect, handler)
// Reads the Bearer token from the Authorization header,
// verifies it, then attaches the full user object to req.user
const protect = async (req, res, next) => {
  try {
    // Check Authorization header exists and has Bearer token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "No token provided. Please log in.",
      });
    }

    // Extract the token string after "Bearer "
    const token = authHeader.split(" ")[1];

    // Verify and decode the token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or expired token. Please log in again.",
      });
    }

    // Fetch full user from DB to get latest role and isActive status
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustResetPassword: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "User no longer exists.",
      });
    }

    // Block deactivated users
    if (!user.isActive) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Your account has been deactivated.",
      });
    }

    // Attach user to request so controllers can access it
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Authentication failed.",
    });
  }
};

// ─── authorizeRoles ───────────────────────────────────────────
// Usage: router.get('/route', protect, authorizeRoles('ADMIN'), handler)
//        router.get('/route', protect, authorizeRoles('ADMIN', 'PROJECT_MANAGER'), handler)
// Must always be used AFTER protect (needs req.user to be set)
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Forbidden",
        message: `Access denied. Required role: ${roles.join(" or ")}`,
      });
    }
    next();
  };
};

module.exports = { protect, authorizeRoles };