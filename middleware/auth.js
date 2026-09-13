const { verifyToken, COOKIE_NAME } = require("../utils/jwt");
const User = require("../models/User");

function getTokenFromRequest(req) {
  if (req.cookies && req.cookies[COOKIE_NAME]) return req.cookies[COOKIE_NAME];
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) return header.slice(7);
  return null;
}

async function authenticate(req, res, next) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return res.status(401).json({ error: "Authentication required" });

    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Authentication required" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Authentication required" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You do not have permission to perform this action" });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
