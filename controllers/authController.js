const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { signToken, setAuthCookie, clearAuthCookie } = require("../utils/jwt");

const SALT_ROUNDS = 10;

async function register(req, res) {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ name, email, passwordHash, role });

  const token = signToken(user);
  setAuthCookie(res, token);
  res.status(201).json({ user: user.toSafeObject() });
}

async function login(req, res) {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !user.isActive) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = signToken(user);
  setAuthCookie(res, token);
  res.json({ user: user.toSafeObject() });
}

async function logout(req, res) {
  clearAuthCookie(res);
  res.status(204).send();
}

async function me(req, res) {
  res.json({ user: req.user.toSafeObject() });
}

module.exports = { register, login, logout, me };
