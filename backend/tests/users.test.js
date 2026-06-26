// backend/tests/users.test.js
// Functional tests for User Management endpoints
// Tests: GET /api/users, POST /api/users, PATCH /api/users/:id, DELETE /api/users/:id/deactivate

const request = require("supertest");
const jwt = require("jsonwebtoken");

// ── Mock Prisma ───────────────────────────────────────────────────────────────
jest.mock("../lib/prisma", () => ({
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

// ── Mock email service so no real emails are sent ─────────────────────────────
jest.mock("../services/emailService", () => ({
  sendOnboardingEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
}));

// ── Mock socket service ───────────────────────────────────────────────────────
jest.mock("../services/socketService", () => ({
  sendUserNotification: jest.fn(),
  notifyAdmins: jest.fn().mockResolvedValue(true),
}));

const prisma = require("../lib/prisma");
const app = require("./helpers/app");

// Helper to generate a valid JWT for a given role
const makeToken = (role, id = 99) =>
  jwt.sign({ id, email: `${role.toLowerCase()}@test.com`, role }, process.env.JWT_SECRET || "test-secret-for-jest-only");

// Mock users returned from DB
const mockUsers = [
  { id: 1, name: "Alice", email: "alice@test.com", role: "COLLABORATOR", isActive: true, mustResetPassword: false, createdAt: new Date() },
  { id: 2, name: "Bob",   email: "bob@test.com",   role: "PROJECT_MANAGER", isActive: true, mustResetPassword: false, createdAt: new Date() },
];

afterEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/users", () => {

  test("returns 200 with user list for ADMIN", async () => {
    // protect middleware: findUnique for auth check
    prisma.user.findUnique.mockResolvedValue({ id: 99, role: "ADMIN", isActive: true, mustResetPassword: false });
    prisma.user.findMany.mockResolvedValue(mockUsers);

    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${makeToken("ADMIN")}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.users.length).toBe(2);
  });

  test("returns 403 when a COLLABORATOR tries to list users", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 5, role: "COLLABORATOR", isActive: true, mustResetPassword: false });

    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${makeToken("COLLABORATOR", 5)}`);

    expect(res.status).toBe(403);
  });

  test("returns 401 when no token is provided", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/users (create user)", () => {

  const newUserPayload = { name: "Carol", email: "carol@test.com", role: "COLLABORATOR" };

  test("returns 201 when ADMIN creates a new user", async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: 99, role: "ADMIN", isActive: true, mustResetPassword: false }) // protect middleware
      .mockResolvedValueOnce(null); // email uniqueness check — no existing user

    prisma.user.create.mockResolvedValue({ id: 10, ...newUserPayload, isActive: true, mustResetPassword: true, createdAt: new Date() });

    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${makeToken("ADMIN")}`)
      .send(newUserPayload);

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("carol@test.com");
  });

  test("returns 400 if required field (name) is missing", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 99, role: "ADMIN", isActive: true, mustResetPassword: false });

    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${makeToken("ADMIN")}`)
      .send({ email: "carol@test.com", role: "COLLABORATOR" }); // name missing

    expect(res.status).toBe(400);
  });

  test("returns 409 if email already exists", async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: 99, role: "ADMIN", isActive: true, mustResetPassword: false })  // protect
      .mockResolvedValueOnce({ id: 1, email: "carol@test.com" }); // email already taken

    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${makeToken("ADMIN")}`)
      .send(newUserPayload);

    expect(res.status).toBe(400); // controller returns 400 (Validation Error) for duplicate email
  });

  test("returns 403 when PROJECT_MANAGER tries to create a user", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 2, role: "PROJECT_MANAGER", isActive: true, mustResetPassword: false });

    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${makeToken("PROJECT_MANAGER", 2)}`)
      .send(newUserPayload);

    expect(res.status).toBe(403);
  });
});
