// backend/controllers/authController.js
// Handles login and password reset
// Member 1 (Sameera)

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const prisma = require("../lib/prisma");
const { sendPasswordResetEmail } = require("../services/emailService");

// ─── POST /api/auth/login ─────────────────────────────────────
// Body: { email, password }
// Returns: { token, user }
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Email and password are required",
      });
    }

    // Find the user by email
    const user = await prisma.user.findUnique({ where: { email } });

    // User not found
    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid email or password",
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Your account has been deactivated. Contact an admin.",
      });
    }

    // Compare submitted password with hashed password in DB
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid email or password",
      });
    }

    // Sign JWT — payload contains id, email, role
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    // Return token + safe user object (no password)
    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustResetPassword: user.mustResetPassword,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Login failed. Please try again.",
    });
  }
};

// ─── POST /api/auth/reset-password ───────────────────────────
// Two use cases:
//   1. Admin-created account: body { tempPassword, newPassword }
//      user is identified by their JWT (protect middleware runs first)
//   2. Could be extended for email reset token later
const resetPassword = async (req, res) => {
  try {
    const { tempPassword, newPassword } = req.body;
    const userId = req.user.id; // injected by protect middleware

    // Validate required fields
    if (!tempPassword || !newPassword) {
      return res.status(400).json({
        error: "Validation Error",
        message: "tempPassword and newPassword are required",
      });
    }

    // Password strength: minimum 8 characters
    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(.{8,})$/;
if (!passwordRegex.test(newPassword)) {
  return res.status(400).json({
    error: "Validation Error",
    message: "Password must be at least 8 characters and include an uppercase letter, a number, and a special character (!@#$%^&*)",
  });
}

    // Fetch user from DB
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({
        error: "Not Found",
        message: "User not found",
      });
    }

    // Verify the temporary password
    const isTempValid = await bcrypt.compare(tempPassword, user.password);
    if (!isTempValid) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Temporary password is incorrect",
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear the mustResetPassword flag
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        mustResetPassword: false,
      },
    });

    return res.status(200).json({
      message: "Password reset successfully. Please log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Password reset failed. Please try again.",
    });
  }
};

// ─── POST /api/auth/forgot-password ───────────────────────────
// Public. Body: { email }. Accounts are admin-provisioned, so this only works for
// an existing, active account — a temporary password is emailed and the user is
// flagged to reset it. Unknown emails and deactivated accounts return an error.
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Validation Error", message: "Email is required." });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({
        error: "Not Found",
        message: "No account found with this email address. Accounts are created by an administrator.",
      });
    }
    if (!user.isActive) {
      return res.status(403).json({
        error: "Forbidden",
        message: "This account has been deactivated. Please contact your administrator.",
      });
    }

    const tempPassword = crypto.randomBytes(5).toString("hex"); // e.g. "a3f9c2d1b4"
    const hashed = await bcrypt.hash(tempPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, mustResetPassword: true },
    });
    // Fire-and-forget — the response shouldn't depend on email delivery timing.
    sendPasswordResetEmail({ to: user.email, name: user.name, tempPassword }).catch((e) =>
      console.error("Password-reset email failed:", e.message)
    );

    return res.status(200).json({
      message: "A temporary password has been sent to your email.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ error: "Internal Server Error", message: "Request failed." });
  }
};

// ─── GET /api/auth/me ───────────────────────────
// Returns the current authenticated user. `protect` re-fetches the user from the
// DB on every request, so req.user carries the latest role / isActive — this lets
// the frontend refresh a cached user after an admin changes their role.
const getMe = async (req, res) => {
  return res.status(200).json({ user: req.user });
};

// ─── POST /api/auth/change-password ───────────────────────────
// Authenticated. Body: { currentPassword, newPassword }. Lets a logged-in user
// voluntarily change their own password (distinct from the temp-password reset).
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Validation Error",
        message: "currentPassword and newPassword are required",
      });
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(.{8,})$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Password must be at least 8 characters and include an uppercase letter, a number, and a special character (!@#$%^&*)",
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "Not Found", message: "User not found" });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Unauthorized", message: "Current password is incorrect" });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        error: "Validation Error",
        message: "New password must be different from the current password.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword, mustResetPassword: false },
    });

    return res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ error: "Internal Server Error", message: "Failed to change password." });
  }
};

module.exports = { login, resetPassword, getMe, forgotPassword, changePassword };