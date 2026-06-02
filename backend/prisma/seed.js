// backend/prisma/seed.js
// Creates the first Admin user so you can log in and test
// Run with: node prisma/seed.js

require("dotenv").config({ path: "../.env" });
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const email = "admin@tms.com";

  // Check if admin already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Admin user already exists — skipping seed.");
    return;
  }

  // Hash the default password
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "System Admin",
      email,
      password: hashedPassword,
      role: "ADMIN",
      isActive: true,
      mustResetPassword: false,
    },
  });

  console.log("✅ Admin user created:");
  console.log(`   Email:    ${admin.email}`);
  console.log(`   Password: admin123`);
  console.log(`   Role:     ${admin.role}`);
  console.log("\n⚠️  Change this password after first login!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });