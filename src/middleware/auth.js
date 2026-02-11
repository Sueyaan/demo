const { verifyAccessToken } = require("../utils/jwt");

function requireAuth(req, res, next) {
    const header = req.headers.authorization || "";
    const [type, token] = header.split(" ");

    if (type !== "Bearer" || !token) {
        return res.status(401).json({ error: "unauthorized" });
    }

    try {
        req.user = verifyAccessToken(token);
        return next();
    } catch (e) {
        return res.status(401).json({ error: "unauthorized " });
    }
}


function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user?.role) return res.status(401).json({ error: "unauthorized" });
        if (!roles.includes(req.user.role)) return res.status(403).json({ error: "forbidden" });
        return next();
    };
}

module.exports = { requireAuth, requireRole };