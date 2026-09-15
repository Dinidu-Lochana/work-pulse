const { z } = require("zod");
const { ROLES } = require("../models/User");

const createUserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  role: z.enum(ROLES).optional().default("team_member"),
});

module.exports = { createUserSchema };
