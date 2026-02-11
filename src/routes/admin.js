const router = require("express").Router();
const bcrypt = require("bcrypt");
const { z } = require("zod");
const prisma = require("../db/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");

router.use(requireAuth, requireRole("admin"));

router.post("/employees", async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      phone: z.string().optional(),
      password: z.string().min(8),
    });

    const body = schema.parse(req.body);

    const rounds = parseInt(process.env.BCRYPT_ROUNDS || "12", 10);
    const passwordHash = await bcrypt.hash(body.password, rounds);

    const created = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        role: "employee",
        passwordHash,
        status: "active",
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return res.status(201).json(created);
  } catch (err) {
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "email_taken" });
    }
    return next(err);
  }
});

router.get("/employees", async (req, res, next) => {
  try {
    const employees = await prisma.user.findMany({
      where: { role: "employee" },
      select: { id: true, name: true, email: true, phone: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ employees });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
