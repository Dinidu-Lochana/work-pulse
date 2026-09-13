const jwt = require("jsonwebtoken");

const COOKIE_NAME = "wp_token";
const EXPIRES_IN = "7d";
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: EXPIRES_IN,
  });
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_MS,
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME);
}

module.exports = { COOKIE_NAME, signToken, verifyToken, setAuthCookie, clearAuthCookie };
