const { z } = require("zod");
const { TASK_PRIORITIES, TASK_STATUSES } = require("../models/Report");
const { objectId } = require("./projectValidators");

const taskCompletedSchema = z.object({
  name: z.string().trim().min(1, "Task name is required").max(200),
  priority: z.enum(TASK_PRIORITIES).optional().default("medium"),
  plannedPercent: z.number().min(0).max(100).optional().default(0),
  actualPercent: z.number().min(0).max(100).optional().default(0),
  status: z.enum(TASK_STATUSES).optional().default("not_started"),
  timePlannedHours: z.number().min(0).optional().default(0),
  timeSpentHours: z.number().min(0).optional().default(0),
  output: z.string().trim().max(1000).optional().default(""),
});

const noteItemSchema = z.object({
  description: z.string().trim().min(1, "Description is required").max(1000),
  isKey: z.boolean().optional().default(false),
});

const hoursByTaskTypeSchema = z
  .object({
    development: z.number().min(0).optional().default(0),
    testing: z.number().min(0).optional().default(0),
    meetings: z.number().min(0).optional().default(0),
    documentation: z.number().min(0).optional().default(0),
    other: z.number().min(0).optional().default(0),
  })
  .optional()
  .default({});

const singleKeyFlag = (items) => items.filter((item) => item.isKey).length <= 1;

const reportContentSchema = z.object({
  weekStart: z.coerce.date(),
  weekEnd: z.coerce.date(),
  project: objectId,
  tasksCompleted: z.array(taskCompletedSchema).optional().default([]),
  tasksPlannedNextWeek: z.array(z.string().trim().min(1).max(500)).optional().default([]),
  blockers: z
    .array(noteItemSchema)
    .optional()
    .default([])
    .refine(singleKeyFlag, "Only one blocker can be flagged as the key issue"),
  achievements: z
    .array(noteItemSchema)
    .optional()
    .default([])
    .refine(singleKeyFlag, "Only one achievement can be flagged as the key achievement"),
  hoursByTaskType: hoursByTaskTypeSchema,
  notes: z.string().trim().max(2000).optional().default(""),
  links: z.array(z.string().trim().url("Each link must be a valid URL")).optional().default([]),
});

const updateReportSchema = reportContentSchema.partial().refine(
  (data) => !data.weekStart || !data.weekEnd || data.weekEnd >= data.weekStart,
  { message: "weekEnd must be on or after weekStart", path: ["weekEnd"] },
);

const createReportSchema = reportContentSchema.refine((data) => data.weekEnd >= data.weekStart, {
  message: "weekEnd must be on or after weekStart",
  path: ["weekEnd"],
});

const reviewReportSchema = z
  .object({
    action: z.enum(["approve", "request_changes"]),
    comment: z.string().trim().max(2000).optional().default(""),
  })
  .refine((data) => data.action !== "request_changes" || data.comment.length > 0, {
    message: "A comment is required when requesting changes",
    path: ["comment"],
  });

module.exports = { createReportSchema, updateReportSchema, reviewReportSchema };
