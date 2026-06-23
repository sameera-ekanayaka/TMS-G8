// backend/lib/prisma.js
// Single shared PrismaClient for the whole app.
// Previously every controller/middleware did `new PrismaClient()`, which opens
// its own connection pool — with enough of them a long-running server can run
// out of database connections. Import this one instance everywhere instead.

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = prisma;
