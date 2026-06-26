// backend/tests/tasks.test.js
// Functional tests for Task Management endpoints
// Tests: GET /api/tasks, POST /api/tasks, PUT /api/tasks/:id/status, DELETE /api/tasks/:id

const request = require("supertest");
const jwt = require("jsonwebtoken");

// ── Mock Prisma ───────────────────────────────────────────────────────────────
jest.mock("../lib/prisma", () => ({
  task: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  project: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  taskAssignment: {
    createMany: jest.fn(),
    deleteMany: jest.fn(),
    findMany: jest.fn(),
  },
  notification: {
    create: jest.fn(),
    createMany: jest.fn(),
  },
}));

// ── Mock socket service ───────────────────────────────────────────────────────
jest.mock("../services/socketService", () => ({
  sendUserNotification: jest.fn(),
  notifyAdmins: jest.fn().mockResolvedValue(true),
}));

const prisma = require("../lib/prisma");
const app = require("./helpers/app");

const SECRET = process.env.JWT_SECRET || "test-secret-for-jest-only";
const makeToken = (role, id = 99) =>
  jwt.sign({ id, email: `${role.toLowerCase()}@test.com`, role }, SECRET);

const mockTask = {
  id: 1,
  title: "Fix login bug",
  description: "The login button doesn't work on mobile",
  priority: "HIGH",
  status: "TODO",
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
  updatedAt: new Date(),
  createdById: 99,
  projectId: "proj-uuid-123",
  assignments: [],
  comments: [],
  attachments: [],
  project: { id: "proj-uuid-123", name: "Test Project" },
  createdBy: { id: 99, name: "Manager", email: "pm@test.com" },
  _count: { comments: 0, attachments: 0 },
};

const pmUser   = { id: 99, role: "PROJECT_MANAGER", isActive: true, mustResetPassword: false };
const collUser = { id: 5,  role: "COLLABORATOR",    isActive: true, mustResetPassword: false };

afterEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/tasks", () => {

  test("returns 200 with task list for PROJECT_MANAGER", async () => {
    prisma.user.findUnique.mockResolvedValue(pmUser);
    prisma.task.findMany.mockResolvedValue([mockTask]);

    const res = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${makeToken("PROJECT_MANAGER")}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.tasks)).toBe(true);
  });

  test("returns 200 with task list for COLLABORATOR (sees assigned tasks)", async () => {
    prisma.user.findUnique.mockResolvedValue(collUser);
    prisma.project.findMany.mockResolvedValue([]);
    // Collaborator sees tasks where they are assigned
    prisma.task.findMany.mockResolvedValue([{ ...mockTask, assignments: [{ userId: 5 }] }]);

    const res = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${makeToken("COLLABORATOR", 5)}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.tasks)).toBe(true);
  });

  test("returns 401 without a token", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/tasks (create task)", () => {

  const taskPayload = {
    title: "New task",
    description: "Description",
    priority: "HIGH",
    projectId: "proj-uuid-123",
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    assignedUserIds: [],
  };

  test("returns 201 when PROJECT_MANAGER creates a task", async () => {
    prisma.user.findUnique.mockResolvedValue(pmUser);
    prisma.project.findUnique.mockResolvedValue({ id: "proj-uuid-123", name: "Test Project" });
    prisma.task.create.mockResolvedValue({ ...mockTask, title: "New task" });
    prisma.taskAssignment.createMany.mockResolvedValue({ count: 0 });

    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${makeToken("PROJECT_MANAGER")}`)
      .send(taskPayload);

    expect(res.status).toBe(201);
    expect(res.body.task.title).toBe("New task");
  });

  test("returns 400 if title is missing", async () => {
    prisma.user.findUnique.mockResolvedValue(pmUser);

    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${makeToken("PROJECT_MANAGER")}`)
      .send({ description: "No title here", priority: "LOW", projectId: "proj-uuid-123" });

    expect(res.status).toBe(400);
  });

  test("returns 400 if projectId is missing", async () => {
    prisma.user.findUnique.mockResolvedValue(pmUser);

    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${makeToken("PROJECT_MANAGER")}`)
      .send({ title: "Task without project", priority: "LOW" });

    expect(res.status).toBe(400);
  });

  test("returns 403 when COLLABORATOR tries to create a task", async () => {
    prisma.user.findUnique.mockResolvedValue(collUser);

    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${makeToken("COLLABORATOR", 5)}`)
      .send(taskPayload);

    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("PUT /api/tasks/:id/status (update status)", () => {

  test("returns 200 when PROJECT_MANAGER updates task status", async () => {
    prisma.user.findUnique.mockResolvedValue(pmUser);
    prisma.task.findUnique.mockResolvedValue({ ...mockTask, assignments: [] });
    prisma.task.update.mockResolvedValue({ ...mockTask, status: "IN_PROGRESS" });
    prisma.taskAssignment.findMany.mockResolvedValue([]);
    prisma.notification.createMany.mockResolvedValue({ count: 0 });

    const res = await request(app)
      .put("/api/tasks/1/status")
      .set("Authorization", `Bearer ${makeToken("PROJECT_MANAGER")}`)
      .send({ status: "IN_PROGRESS" });

    expect(res.status).toBe(200);
    expect(res.body.task.status).toBe("IN_PROGRESS");
  });

  test("returns 400 if status value is invalid", async () => {
    prisma.user.findUnique.mockResolvedValue(pmUser);
    prisma.task.findUnique.mockResolvedValue(mockTask);

    const res = await request(app)
      .put("/api/tasks/1/status")
      .set("Authorization", `Bearer ${makeToken("PROJECT_MANAGER")}`)
      .send({ status: "INVALID_STATUS" });

    expect(res.status).toBe(400);
  });

  test("returns 403 when COLLABORATOR tries to update status of task not assigned to them", async () => {
    prisma.user.findUnique.mockResolvedValue(collUser);
    // Task exists but collaborator (id=5) is NOT in assignments
    prisma.task.findUnique.mockResolvedValue({ ...mockTask, assignments: [] });

    const res = await request(app)
      .put("/api/tasks/1/status")
      .set("Authorization", `Bearer ${makeToken("COLLABORATOR", 5)}`)
      .send({ status: "IN_PROGRESS" });

    expect(res.status).toBe(403);
  });

  test("returns 200 when COLLABORATOR updates status of their own assigned task", async () => {
    prisma.user.findUnique.mockResolvedValue(collUser);
    prisma.task.findUnique.mockResolvedValue({
      ...mockTask,
      assignments: [{ userId: 5, user: collUser }],
    });
    prisma.task.update.mockResolvedValue({ ...mockTask, status: "COMPLETED" });
    prisma.taskAssignment.findMany.mockResolvedValue([]);
    prisma.notification.createMany.mockResolvedValue({ count: 0 });

    const res = await request(app)
      .put("/api/tasks/1/status")
      .set("Authorization", `Bearer ${makeToken("COLLABORATOR", 5)}`)
      .send({ status: "COMPLETED" });

    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("DELETE /api/tasks/:id", () => {

  test("returns 200 when PROJECT_MANAGER deletes a task", async () => {
    prisma.user.findUnique.mockResolvedValue(pmUser);
    prisma.task.findUnique.mockResolvedValue(mockTask);
    prisma.task.delete.mockResolvedValue(mockTask);

    const res = await request(app)
      .delete("/api/tasks/1")
      .set("Authorization", `Bearer ${makeToken("PROJECT_MANAGER")}`);

    expect(res.status).toBe(200);
  });

  test("returns 403 when COLLABORATOR tries to delete a task", async () => {
    prisma.user.findUnique.mockResolvedValue(collUser);
    prisma.task.findUnique.mockResolvedValue(mockTask);

    const res = await request(app)
      .delete("/api/tasks/1")
      .set("Authorization", `Bearer ${makeToken("COLLABORATOR", 5)}`);

    expect(res.status).toBe(403);
  });

  test("returns 404 when task does not exist", async () => {
    prisma.user.findUnique.mockResolvedValue(pmUser);
    prisma.task.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .delete("/api/tasks/999")
      .set("Authorization", `Bearer ${makeToken("PROJECT_MANAGER")}`);

    expect(res.status).toBe(404);
  });
});
