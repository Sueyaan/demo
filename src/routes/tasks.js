const router = require("express").Router();
const { z } = require("zod");
const prisma = require("../db/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");

router.use(requireAuth);

router.get("/stats", requireRole("owner", "manager"), async (req, res, next) => {
    try {
        const total = await prisma.task.count();
        const done = await prisma.task.count({ where: { status: "done" } });
        const inProgress = await prisma.task.count({ where: { status: "in_progress" } });
        const assigned = await prisma.task.count({ where: { status: "assigned" } });

        return res.json({ total, done, inProgress, assigned });
    } catch (err) {
        return next(err);
    }
});


router.get("/me", requireRole("employee"), async (req, res, next) => {
  try {
    const userId = req.user.sub;

    const tasks = await prisma.task.findMany({
      where: { assignedToId: userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        dueAt: true,
        createdAt: true,
        assignedById: true,
        assignedToId: true,
        assignedTo: {
          select: { id: true, name: true, email: true }
        },
        assignedBy: {
          select: { id: true, name: true, email: true }
        }
      },
    });

    return res.json({ tasks });
  } catch (err) {
    return next(err);
  }
});


router.get("/", requireRole("owner", "manager"), async (req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        dueAt: true,
        createdAt: true,
        assignedById: true,
        assignedToId: true,
        assignedTo: {
          select: { id: true, name: true, email: true }
        },
        assignedBy: {
          select: { id: true, name: true, email: true }
        }
      },
    });

    return res.json({ tasks });
  } catch (err) {
    return next(err);
  }
});


router.get("/by-employee/:employeeId", requireRole("owner", "manager"), async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const tasks = await prisma.task.findMany({
      where: { assignedToId: employeeId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        dueAt: true,
        createdAt: true,
        assignedById: true,
        assignedToId: true,
        assignedTo: {
          select: { id: true, name: true, email: true }
        },
        assignedBy: {
          select: { id: true, name: true, email: true }
        }
      },
    });
    return res.json({ tasks });
  } catch (err) {
    return next(err);
  }
});






router.post("/", requireRole("owner"), async (req, res, next) => {
  try {
    const schema = z.object({
      title: z.string().min(2).max(200),
      description: z.string().max(5000).optional(),
      assignedToId: z.string().min(1),
      dueAt: z.coerce.date().optional(),
    });

    const body = schema.parse(req.body);
    const assignedById = req.user.sub;

    const assignedTo = await prisma.user.findUnique({
      where: { id: body.assignedToId },
      select: { id: true, role: true, status: true },
    });

    if (!assignedTo || assignedTo.status !== "active") {
      return res.status(400).json({ error: "invalid_assignedTo" });
    }
    if (assignedTo.role !== "employee") {
      return res.status(400).json({ error: "assignedTo_must_be_employee" });
    }

    const task = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description,
        dueAt: body.dueAt ?? null,
        assignedToId: body.assignedToId, 
        assignedById,
        status: "assigned",
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        dueAt: true,
        createdAt: true,
        assignedToId: true,
        assignedById: true,
        assignedTo: {
          select: { id: true, name: true, email: true }
        },
        assignedBy: {
          select: { id: true, name: true, email: true }
        }
      },
    });

    return res.status(201).json(task);
  } catch (err) {
    return next(err);
  }
});






router.patch("/:id/status", requireRole("owner", "employee"), async (req, res, next) => {
  try {
    const paramsSchema = z.object({ id: z.string().min(1) });
    const bodySchema = z.object({
      status: z.enum(["assigned", "in_progress", "done"]),
    });

    const { id } = paramsSchema.parse(req.params);
    const { status } = bodySchema.parse(req.body);

    const task = await prisma.task.findUnique({
      where: { id },
      select: { id: true, assignedToId: true, status: true },
    });

    if (!task) return res.status(404).json({ error: "task_not_found" });

    const isOwner = req.user.role === "owner";
    const isAssignee = task.assignedToId === req.user.sub;

    if (!isOwner && !isAssignee) return res.status(403).json({ error: "forbidden" });

    const order = { assigned: 1, in_progress: 2, done: 3 };
    if (!isOwner && order[status] < order[task.status]) {
      return res.status(400).json({ error: "invalid_status_transition" });
    }

    const updated = await prisma.task.update({ 
      where: { id },
      data: { status },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        dueAt: true,
        createdAt: true,
        assignedToId: true,
        assignedById: true,
        assignedTo: {
          select: { id: true, name: true, email: true }
        },
        assignedBy: {
          select: { id: true, name: true, email: true }
        }
      },
    });

    return res.json(updated);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;