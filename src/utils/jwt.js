const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_ACCESS_SECRET;
if (!SECRET) throw new Error("JWT_ACCESS_SECRET is missing");

const TTL = process.env.JWT_ACCESS_TTL || "15m";

function signAccessToken(payload) {
  return jwt.sign(payload, SECRET, { algorithm: "HS256", expiresIn: TTL });
}

function verifyAccessToken(token) {
  return jwt.verify(token, SECRET, { algorithms: ["HS256"] });
}

module.exports = { signAccessToken, verifyAccessToken };
