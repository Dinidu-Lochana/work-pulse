const mongoose = require("mongoose");

const STATUSES = ["draft", "submitted", "needs_correction", "approved"];
const TASK_PRIORITIES = ["low", "medium", "high"];
const TASK_STATUSES = ["not_started", "in_progress", "completed", "blocked"];

const taskCompletedSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    priority: { type: String, enum: TASK_PRIORITIES, default: "medium" },
    plannedPercent: { type: Number, min: 0, max: 100, default: 0 },
    actualPercent: { type: Number, min: 0, max: 100, default: 0 },
    status: { type: String, enum: TASK_STATUSES, default: "not_started" },
    timePlannedHours: { type: Number, min: 0, default: 0 },
    timeSpentHours: { type: Number, min: 0, default: 0 },
    output: { type: String, default: "" },
  },
  { _id: false },
);

const noteItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    isKey: { type: Boolean, default: false },
  },
  { _id: false },
);

const hoursByTaskTypeSchema = new mongoose.Schema(
  {
    development: { type: Number, min: 0, default: 0 },
    testing: { type: Number, min: 0, default: 0 },
    meetings: { type: Number, min: 0, default: 0 },
    documentation: { type: Number, min: 0, default: 0 },
    other: { type: Number, min: 0, default: 0 },
  },
  { _id: false },
);

// Every field a report can carry, aside from status/review/version bookkeeping.
// Kept as its own sub-schema so it can be reused verbatim as the shape of a
// version snapshot (see `versions` below).
const reportContentFields = {
  weekStart: { type: Date, required: true },
  weekEnd: { type: Date, required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  tasksCompleted: { type: [taskCompletedSchema], default: [] },
  tasksPlannedNextWeek: { type: [String], default: [] },
  blockers: { type: [noteItemSchema], default: [] },
  achievements: { type: [noteItemSchema], default: [] },
  hoursByTaskType: { type: hoursByTaskTypeSchema, default: () => ({}) },
  notes: { type: String, default: "" },
  links: { type: [String], default: [] },
};

const reportVersionSchema = new mongoose.Schema(
  {
    ...reportContentFields,
    submittedAt: { type: Date, required: true },
  },
  { _id: true },
);

const reviewHistoryEntrySchema = new mongoose.Schema(
  {
    action: { type: String, enum: ["approved", "requested_changes"], required: true },
    comment: { type: String, default: "" },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    versionId: { type: mongoose.Schema.Types.ObjectId, default: null },
    reviewedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const reportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: STATUSES, default: "draft" },
    ...reportContentFields,
    reviewComment: { type: String, default: "" },
    reviewHistory: { type: [reviewHistoryEntrySchema], default: [] },
    versions: { type: [reportVersionSchema], default: [] },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

reportSchema.index({ user: 1, weekStart: 1 }, { unique: true });

module.exports = mongoose.model("Report", reportSchema);
module.exports.STATUSES = STATUSES;
module.exports.TASK_PRIORITIES = TASK_PRIORITIES;
module.exports.TASK_STATUSES = TASK_STATUSES;
