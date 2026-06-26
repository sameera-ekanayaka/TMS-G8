// backend/controllers/userController.js
// User management — Admin only (enforced in routes via authorizeRoles)
// Member 1 (Sameera)

const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { sendOnboardingEmail } = require("../services/emailService");
const { sendUserNotification, notifyAdmins } = require("../services/socketService");

const prisma = require("../lib/prisma");

// ─── GET /api/users ───────────────────────────────────────────
// Returns all users (excluding passwords)
// Admin only
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustResetPassword: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ users });
  } catch (error) {
    console.error("Get all users error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch users.",
    });
  }
};

// ─── GET /api/users/:id ───────────────────────────────────────
// Returns a single user by ID
// Admin only
const getUserById = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustResetPassword: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: "Not Found",
        message: "User not found.",
      });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Get user by ID error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch user.",
    });
  }
};

// ─── POST /api/users ──────────────────────────────────────────
// Admin creates a new user with a temporary password
// Sends onboarding email with temp password
// Body: { name, email, role }
const createUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;

    // Validate required fields
    if (!name || !email || !role) {
      return res.status(400).json({
        error: "Validation Error",
        message: "name, email, and role are required.",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Please provide a valid email address.",
      });
    }

    // Validate role value
    const validRoles = ["ADMIN", "PROJECT_MANAGER", "COLLABORATOR"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: "Validation Error",
        message: `role must be one of: ${validRoles.join(", ")}`,
      });
    }

    // Check email is not already taken
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({
        error: "Validation Error",
        message: "A user with this email already exists.",
      });
    }

    // Generate a random 10-character temporary password
    const tempPassword = crypto.randomBytes(5).toString("hex"); // e.g. "a3f9c2d1b4"

    // Hash the temp password before storing
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create the user in DB
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        mustResetPassword: true, // forces password change on first login
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustResetPassword: true,
        createdAt: true,
      },
    });

    // Send onboarding email in the background (fire-and-forget) so SMTP delays/blocks don't freeze the UI
    sendOnboardingEmail({
      to: email,
      name,
      email,
      tempPassword,
      role,
    }).catch((emailError) => {
      console.error("Onboarding email background failure:", emailError.message);
    });

    // Notify admins about the new user
    notifyAdmins(req.io, {
      message: `New user created: ${name} (${role})`,
      actorId: req.user.id
    });

    return res.status(201).json({
      message: "User created successfully.",
      tempPassword, // Returned as a fallback in case the email fails to deliver
      user: newUser,
    });
  } catch (error) {
    console.error("Create user error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to create user.",
    });
  }
};

// ─── PUT /api/users/:id ───────────────────────────────────────
// Admin updates a user's name, email, or role
// Body: { name?, email?, role? }
const updateUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { name, email, role } = req.body;

    // At least one field must be provided
    if (!name && !email && !role) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Provide at least one field to update: name, email, or role.",
      });
    }

    // Validate role if provided
    const validRoles = ["ADMIN", "PROJECT_MANAGER", "COLLABORATOR"];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        error: "Validation Error",
        message: `role must be one of: ${validRoles.join(", ")}`,
      });
    }

    // Check user exists
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      return res.status(404).json({
        error: "Not Found",
        message: "User not found.",
      });
    }

    // Prevent any admin from editing another admin's account.
    // An admin may still edit their own profile (id match is allowed).
    if (existing.role === "ADMIN" && existing.id !== req.user.id) {
      return res.status(403).json({
        error: "Forbidden",
        message: "An admin cannot edit another admin's account.",
      });
    }

    // don't let the last active admin be demoted, or nobody can manage users
    if (role && existing.role === "ADMIN" && role !== "ADMIN") {
      const activeAdminCount = await prisma.user.count({
        where: { role: "ADMIN", isActive: true },
      });
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          error: "Validation Error",
          message: "Cannot change the role of the last active admin.",
        });
      }
    }

    // If email is changing, validate format then check uniqueness
    if (email && email !== existing.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: "Validation Error",
          message: "Please provide a valid email address.",
        });
      }

      const emailTaken = await prisma.user.findUnique({ where: { email } });
      if (emailTaken) {
        return res.status(400).json({
          error: "Validation Error",
          message: "This email is already in use by another account.",
        });
      }
    }

    // Build update object with only provided fields
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Administrative update: notify the user when their role changes (SRS).
    // Fire-and-forget so a notification failure never breaks the update.
    if (role && role !== existing.role) {
      const readableRole = role.replace(/_/g, " ").toLowerCase();
      sendUserNotification(
        req.io,
        req.connectedUsers,
        userId,
        `Your role was changed to ${readableRole}. Please log out and log back in to apply it.`
      ).catch((e) => console.error("Role-change notification failed:", e.message));

      // The role is baked into the JWT + the cached client session, so the new
      // role only fully applies after re-login. Tell the live session to log out.
      if (req.io) {
        req.io.to(`user:${userId}`).emit("force_logout", {
          reason: "role_changed",
          message: `Your role was changed to ${readableRole}. Please log in again to continue.`,
        });
      }
    }

    // Notify admins about the update
    let updateMessage = `User "${updatedUser.name}" was updated.`;
    if (role && role !== existing.role) {
      updateMessage = `Role for "${updatedUser.name}" changed to ${role}.`;
    }
    notifyAdmins(req.io, {
      message: updateMessage,
      actorId: req.user.id
    });

    return res.status(200).json({
      message: "User updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to update user.",
    });
  }
};

// ─── PATCH /api/users/:id/deactivate ─────────────────────────
// Admin deactivates a user (soft delete — keeps data intact)
// Deactivated users cannot log in
const deactivateUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Prevent admin from deactivating themselves
    if (userId === req.user.id) {
      return res.status(400).json({
        error: "Validation Error",
        message: "You cannot deactivate your own account.",
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({
        error: "Not Found",
        message: "User not found.",
      });
    }

    // Prevent any admin from deactivating another admin's account.
    if (user.role === "ADMIN") {
      return res.status(403).json({
        error: "Forbidden",
        message: "An admin cannot deactivate another admin's account.",
      });
    }

    if (!user.isActive) {
      return res.status(400).json({
        error: "Validation Error",
        message: "User is already deactivated.",
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    notifyAdmins(req.io, {
      message: `User "${user.name}" was deactivated.`,
      actorId: req.user.id
    });

    return res.status(200).json({
      message: "User deactivated successfully.",
    });
  } catch (error) {
    console.error("Deactivate user error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to deactivate user.",
    });
  }
};

// ─── PATCH /api/users/:id/activate ───────────────────────────
// Admin re-activates a previously deactivated user
const activateUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({
        error: "Not Found",
        message: "User not found.",
      });
    }

    if (user.isActive) {
      return res.status(400).json({
        error: "Validation Error",
        message: "User is already active.",
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });

    notifyAdmins(req.io, {
      message: `User "${user.name}" was re-activated.`,
      actorId: req.user.id
    });

    return res.status(200).json({
      message: "User activated successfully.",
    });
  } catch (error) {
    console.error("Activate user error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to activate user.",
    });
  }
};

// ─── DELETE /api/users/:id ───────────────────────────
// Admin permanently deletes a user. Only a *deactivated* user can be deleted
// (deactivate first), since a hard delete cascades — it also removes the tasks
// that user created, plus their comments, attachments, assignments, and
// notifications (managed projects just have their manager cleared).
const deleteUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (userId === req.user.id) {
      return res.status(400).json({
        error: "Validation Error",
        message: "You cannot delete your own account.",
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({
        error: "Not Found",
        message: "User not found.",
      });
    }

    // Prevent any admin from deleting another admin's account.
    if (user.role === "ADMIN") {
      return res.status(403).json({
        error: "Forbidden",
        message: "An admin cannot delete another admin's account.",
      });
    }

    if (user.isActive) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Deactivate the user before permanently deleting them.",
      });
    }

    // Preserve the user's created work: their created tasks (and any projects they
    // managed) cascade-delete with the user, so reassign them to the acting admin
    // first. Their own contributions (assignments, comments, attachments,
    // notifications) still cascade away with the account.
    await prisma.$transaction([
      prisma.task.updateMany({ where: { createdById: userId }, data: { createdById: req.user.id } }),
      prisma.project.updateMany({ where: { managerId: userId }, data: { managerId: req.user.id } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    notifyAdmins(req.io, {
      message: `User "${user.name}" was permanently deleted.`,
      actorId: req.user.id
    });

    return res.status(200).json({
      message: "User permanently deleted. Their tasks and projects were reassigned to you.",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to delete user.",
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
  activateUser,
  deleteUser,
};