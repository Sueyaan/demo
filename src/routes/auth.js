const router = require("express").Router();
const bcrypt = require("bcrypt");
const { z } = require("zod");
const prisma = require("../db/prisma");
const { signAccessToken } = require("../utils/jwt");

router.post("/login", async (req, res) => {
    const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
    });
    
    const { email, password } = schema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.status !== "active") return res.status(401).json({ error: "invalid_credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "invalid_credentials" });

    const accessToken = signAccessToken({ sub: user.id, role: user.role, email: user.email });
    res.json({ accessToken, user: { id: user.id, name:user.name, role: user.role } });

});
module.exports = router;