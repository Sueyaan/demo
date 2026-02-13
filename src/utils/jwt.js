const jwt = require("jsonwebtoken");

const secret = process.env.JWT_ACCESS_SECRET;
if (!secret) throw new Error("Missing JWT_ACCESS_SECRET");

const ttl = process.env.JWT_ACCESS_TTL || "15m";

function signAccessToken(payload) {
  return jwt.sign(payload, secret, { expiresIn: ttl });
}

function verifyAccessToken(token) {
  return jwt.verify(token, secret);
}

module.exports = { signAccessToken, verifyAccessToken };
