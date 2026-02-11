const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
require("dotenv").config();

const prisma = new PrismaClient();

async function main() {
    const email = "admin@company.com";
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return;

    const rounds = parseInt(process.env.BCRYPT_ROUNDS || "12", 10);
    const passwordHash = await bcrypt.hash("ChangeMeNow!123", rounds);

    await prisma.user.create({
        data: {
            name: "Admin",
            email, 
            role: "admin",
            passwordHash,
            status: "active",
        },
    });
}

main()
    .finally(async () => prisma.$discounnect());