// backend/lib/prisma.js
// One shared PrismaClient for the whole app. Using new PrismaClient() in every
// file opens a separate connection pool, which can exhaust DB connections.

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = prisma;
