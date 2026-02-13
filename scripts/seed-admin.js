require("dotenv").config();
const bcrypt = require("bcrypt");
const prisma = require("../src/db/prisma");

async function upsertUser({ name, email, password, role }) { 
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || "12", 10);
  const passwordHash = await bcrypt.hash(password, rounds);

  return prisma.user.upsert({
    where: { email },
    update: { name, role, passwordHash, status: "active" },
    create: { name, email, role, passwordHash, status: "active" },
    select: { id: true, name: true, email: true, role: true },
  });
}

async function main() {
  const owner = await upsertUser({
    name: "Owner",
    email: "owner@company.com",
    password: "ChangeMeNow!123",
    role: "owner",
  });

  const manager = await upsertUser({
    name: "Manager",
    email: "manager@company.com",
    password: "ChangeMeNow!123",
    role: "manager",
  });

  console.log({ owner, manager });
}

main()
.catch((e) =>{
  console.error(e);
  process.exit(1);
})
.finally(() => prisma.$disconnect());