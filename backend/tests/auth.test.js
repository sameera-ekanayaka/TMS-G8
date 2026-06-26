// backend/tests/auth.test.js
// Functional tests for Authentication endpoints
// Tests: POST /api/auth/login

const request = require("supertest");
const bcrypt = require("bcryptjs");

// ── Mock Prisma so tests don't need a live database ──────────────────────────
jest.mock("../lib/prisma", () => ({
  user: {
    findUnique: jest.fn(),
  },
}));

const prisma = require("../lib/prisma");
const app = require("./helpers/app");

// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/auth/login", () => {
  const hashedPassword = bcrypt.hashSync("password123", 10);

  const mockUser = {
    id: 1,
    name: "Test User",
    email: "test@example.com",
    password: hashedPassword,
    role: "PROJECT_MANAGER",
    isActive: true,
    mustResetPassword: false,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── 1. Successful login ──────────────────────────────────────────────────
  test("returns 200 and a JWT token on valid credentials", async () => {
    prisma.user.findUnique.mockResolvedValue(mockUser);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.email).toBe("test@example.com");
    expect(res.body.user).not.toHaveProperty("password"); // password never returned
  });

  // ── 2. Missing email ─────────────────────────────────────────────────────
  test("returns 400 if email is missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ password: "password123" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation Error");
  });

  // ── 3. Missing password ──────────────────────────────────────────────────
  test("returns 400 if password is missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation Error");
  });

  // ── 4. Wrong password ────────────────────────────────────────────────────
  test("returns 401 if password is incorrect", async () => {
    prisma.user.findUnique.mockResolvedValue(mockUser);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "wrongpassword" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized");
  });

  // ── 5. User not found ────────────────────────────────────────────────────
  test("returns 401 if user email does not exist", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "noone@example.com", password: "password123" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized");
  });

  // ── 6. Deactivated account ───────────────────────────────────────────────
  test("returns 403 if user account is deactivated", async () => {
    prisma.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "password123" });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden");
  });
});
