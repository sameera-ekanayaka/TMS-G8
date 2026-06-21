// backend/services/deadlineService.js
// Handles scheduled deadline checks and notifications
// Runs every hour to check for tasks with approaching deadlines
// Member 2 (Subanya)

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// ════════ Check Deadline and Create Notifications ════════════════════════
// This function:
// 1. Finds all tasks with dueDate in the next 24 hours
// 2. Creates notifications for all assigned users
// 3. Should be called every hour by a cron job
const checkAndNotifyDeadlines = async (io, connectedUsers) => {
  try {
    console.log("🔔 Checking for approaching deadlines...");

    // Calculate time windows
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Find all tasks with deadlines in the next 24 hours that are not completed
    const upcomingTasks = await prisma.task.findMany({
      where: {
        dueDate: {
          gte: now, // Due date is today or later
          lte: in24Hours, // Due date is within 24 hours
        },
        status: {
          not: "COMPLETED", // Don't notify for completed tasks
        },
      },
      include: {
        assignments: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        createdBy: { select: { id: true, name: true } },
      },
    });

    console.log(`Found ${upcomingTasks.length} tasks with approaching deadlines`);

    // For each task with approaching deadline
    for (const task of upcomingTasks) {
      // Check if a notification already exists for this task today
      // (to avoid duplicate notifications)
      // Check if a notification for this task was already sent to any assigned user
      // within the last hour to avoid duplicate notifications per run
      const existingNotification = await prisma.notification.findFirst({
        where: {
          message: {
            contains: `Task "${task.title}" is due soon`,
          },
          userId: task.assignments.length > 0 ? task.assignments[0].userId : undefined,
          createdAt: {
            gte: new Date(now.getTime() - 1 * 60 * 60 * 1000), // Within last hour
          },
        },
      });

      // Only create notification if one doesn't already exist
      if (!existingNotification) {
        // Calculate hours until deadline
        const hoursUntilDeadline = Math.floor(
          (task.dueDate - now) / (60 * 60 * 1000)
        );

        const message = `Task "${task.title}" is due soon (in ${hoursUntilDeadline} hours)`;

        // Create notification for each assigned user
        for (const assignment of task.assignments) {
          const dbNotification = await prisma.notification.create({
            data: {
              message,
              userId: assignment.userId,
              isRead: false,
            },
          });

          // Send real-time Socket.io notification if user is connected
          if (io && connectedUsers[assignment.userId]) {
            io.to(connectedUsers[assignment.userId]).emit(
              "deadline_approaching",
              {
                message,
                task: {
                  id: task.id,
                  title: task.title,
                  dueDate: task.dueDate,
                  priority: task.priority,
                  status: task.status,
                },
                hoursUntilDeadline,
                timestamp: new Date(),
              }
            );
            io.to(connectedUsers[assignment.userId]).emit("notification", dbNotification);
            console.log(
              `✅ Deadline notification sent to user ${assignment.userId}`
            );
          } else {
            console.log(
              `⚠️ User ${assignment.userId} not connected. Notification saved to DB.`
            );
          }
        }

        // Also notify the task creator
        if (task.createdById) {
          const creatorNotification = await prisma.notification.create({
            data: {
              message: `Your task "${task.title}" is due soon (in ${hoursUntilDeadline} hours)`,
              userId: task.createdById,
              isRead: false,
            },
          });

          if (io && connectedUsers[task.createdById]) {
            io.to(connectedUsers[task.createdById]).emit(
              "deadline_approaching",
              {
                message: `Your task "${task.title}" is due soon (in ${hoursUntilDeadline} hours)`,
                task: {
                  id: task.id,
                  title: task.title,
                  dueDate: task.dueDate,
                  priority: task.priority,
                },
                hoursUntilDeadline,
                timestamp: new Date(),
              }
            );
            io.to(connectedUsers[task.createdById]).emit("notification", creatorNotification);
          }
        }
      }
    }

    console.log("✅ Deadline check complete");
    return upcomingTasks.length;
  } catch (error) {
    console.error("Error checking deadlines:", error);
    return 0;
  }
};

// ════════ Initialize Deadline Scheduler ════════════════════════════════════
// This function:
// 1. Should be called when server starts
// 2. Sets up a scheduled job that runs every hour
// 3. Checks for approaching deadlines and creates notifications
const initializeDeadlineScheduler = (io, connectedUsers) => {
  console.log("⏰ Initializing deadline notification scheduler...");

  // Run deadline check immediately on startup
  checkAndNotifyDeadlines(io, connectedUsers);

  // Then run it every hour (3600000 milliseconds)
  // Comment this out if testing - it will spam notifications!
  const scheduledJob = setInterval(
    () => checkAndNotifyDeadlines(io, connectedUsers),
    1 * 60 * 60 * 1000 // 1 hour
  );

  console.log("✅ Deadline scheduler initialized. Running every 1 hour.");

  // Return the interval ID so it can be cleared if needed
  return scheduledJob;
};

// ════════ Manual Deadline Check (for testing) ════════════════════════════
// Call this endpoint to manually trigger deadline check without waiting
const manualDeadlineCheck = async (req, res) => {
  try {
    const io = req.io;
    const connectedUsers = req.connectedUsers;

    const tasksChecked = await checkAndNotifyDeadlines(io, connectedUsers);

    return res.status(200).json({
      message: "Deadline check completed",
      tasksWithApproachingDeadlines: tasksChecked,
    });
  } catch (error) {
    console.error("Manual deadline check error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to check deadlines",
    });
  }
};

module.exports = {
  checkAndNotifyDeadlines,
  initializeDeadlineScheduler,
  manualDeadlineCheck,
};