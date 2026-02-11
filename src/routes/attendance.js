const router = require("express").Router();
const prisma = require("../db/prisma");
const { requireAuth } = require("../middleware/auth");
const { route } = require("./auth");

router.use(requireAuth);

router.post("/start", async (req, res, next) => {
    try {

        const userId = req.user.sub;

        const open = await prisma.attendance.findFirst({
            where: { userId, endTime: null },
            select: { id:true }, 
        });

        if (open) return res.status(400).json({ error: "shift_already_started" });

        const record = await prisma.attendance.create({
            data: { userId, startTime:new Date() },
            select: { id: true, userId: true, startTime: true, endTime: true },
        });
        res.status(201).json(record);
    } catch (err) {
        next(err);
    }
});


router.post("/end", async (req, res, next) => {
    try {
        const userId = req.user.sub;

        const open = await prisma.attendance.findFirst({
            where: { userId, endTime: null },
            orderBy: { startTime: "desc" }, 
            select: { id: true, startTime: true },
        });

        if (!open) return res.status(400).json({ error: "no_open_shift" });

        const endTime = new Date();
        const durationMinutes = Math.max(
            0,
            Math.round((endTime.getTime() - new Date(open.startTime).getTime()) / 60000)
        );

        const updated = await prisma.attendance.update({
            where: { id: open.id }, 
            data: { endTime, durationMinutes }, 
            select: { id: true, userId: true, startTime: true, endTime: true, durationMinutes:true },

        });

        res.json(updated);
    } catch (err) {
        next(err);
    }
});

router.get("/me", async (req, res, next) => {
    try {
        const userId = req.user.sub;

        const records = await prisma.attendance.findMany({
            where: { userId },
            orderBy: { startTime: "desc" },
            take:50,
            select: { id: true, startTime: true, endTime: true, durationMinutes:true },

        });

        res.json({ records });
    } catch (err) {
        next(err);
    }
});

module.exports = router; 