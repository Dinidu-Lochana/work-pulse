const { z } = require("zod");

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(4000),
});

const chatSchema = z.object({
  message: z.string().trim().min(1, "Message is required").max(2000),
  history: z.array(chatMessageSchema).max(20).optional().default([]),
});

module.exports = { chatSchema };
