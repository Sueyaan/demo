require("dotenv").config();
const bcrypt = require("bcrypt");
const prisma = require("../src/db/prisma");

async function main() {
  const email = "admin@company.com";
  const password = "ChangeMeNow!123";
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || "12", 10);
  const passwordHash = await bcrypt.hash(password, rounds);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: "admin", status: "active", name: "Admin" },
    create: { email, passwordHash, role: "admin", status: "active", name: "Admin" },
  });

  console.log("Seeded admin:", admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
