const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const { ROLES } = require("../models/User");

const SALT_ROUNDS = 10;

async function createUser(req, res) {
  const { name, email, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }

  const temporaryPassword = crypto.randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(temporaryPassword, SALT_ROUNDS);
  const user = await User.create({ name, email, passwordHash, role });

  res.status(201).json({ user: user.toSafeObject(), temporaryPassword });
}

async function listUsers(req, res) {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.includeInactive !== "true") filter.isActive = true;

  const users = await User.find(filter).sort({ name: 1 });
  res.json({ users: users.map((user) => user.toSafeObject()) });
}

async function updateUserRole(req, res) {
  const { role } = req.body;
  if (!ROLES.includes(role)) {
    return res.status(400).json({ error: `role must be one of: ${ROLES.join(", ")}` });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  user.role = role;
  await user.save();
  res.json({ user: user.toSafeObject() });
}

async function removeUser(req, res) {
  if (req.params.id === req.user.id.toString()) {
    return res.status(400).json({ error: "You cannot remove your own account" });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  user.isActive = false;
  await user.save();
  res.status(204).send();
}

async function reactivateUser(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  user.isActive = true;
  await user.save();
  res.json({ user: user.toSafeObject() });
}

module.exports = { createUser, listUsers, updateUserRole, removeUser, reactivateUser };
