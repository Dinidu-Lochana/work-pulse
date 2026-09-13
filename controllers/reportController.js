const Report = require("../models/Report");
const { parsePagination, buildPaginationMeta } = require("../utils/pagination");

const CONTENT_FIELDS = [
  "weekStart",
  "weekEnd",
  "project",
  "tasksCompleted",
  "tasksPlannedNextWeek",
  "blockers",
  "achievements",
  "hoursByTaskType",
  "notes",
  "links",
];

const EDITABLE_STATUSES = ["draft", "needs_correction"];

function isOwner(report, user) {
  return report.user.toString() === user.id.toString();
}

function pickContentFields(source) {
  const content = {};
  for (const field of CONTENT_FIELDS) {
    if (source[field] !== undefined) content[field] = source[field];
  }
  return content;
}

async function createReport(req, res) {
  const report = await Report.create({
    ...pickContentFields(req.body),
    user: req.user._id,
    status: "draft",
  });
  res.status(201).json({ report });
}

async function updateReport(req, res) {
  const report = await Report.findById(req.params.id);
  if (!report) return res.status(404).json({ error: "Report not found" });
  if (!isOwner(report, req.user)) {
    return res.status(403).json({ error: "You can only edit your own reports" });
  }
  if (!EDITABLE_STATUSES.includes(report.status)) {
    return res.status(409).json({ error: `A report in '${report.status}' status cannot be edited` });
  }

  Object.assign(report, pickContentFields(req.body));
  await report.save();
  res.json({ report });
}

async function submitReport(req, res) {
  const report = await Report.findById(req.params.id);
  if (!report) return res.status(404).json({ error: "Report not found" });
  if (!isOwner(report, req.user)) {
    return res.status(403).json({ error: "You can only submit your own reports" });
  }
  if (!EDITABLE_STATUSES.includes(report.status)) {
    return res.status(409).json({ error: `A report in '${report.status}' status cannot be submitted` });
  }

  const submittedAt = new Date();
  const snapshot = pickContentFields(report.toObject());
  report.versions.push({ ...snapshot, submittedAt });
  report.status = "submitted";
  report.submittedAt = submittedAt;
  await report.save();
  res.json({ report });
}

async function getReport(req, res) {
  const report = await Report.findById(req.params.id)
    .populate("user", "name email")
    .populate("project", "name")
    .populate("reviewHistory.reviewer", "name email");
  if (!report) return res.status(404).json({ error: "Report not found" });

  const owner = isOwner(report, req.user);
  const canManagerView = req.user.role === "manager" && report.status !== "draft";
  if (!owner && !canManagerView) {
    return res.status(403).json({ error: "You can only view your own reports" });
  }

  res.json({ report });
}

async function listMyReports(req, res) {
  const filter = { user: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.project) filter.project = req.query.project;
  if (req.query.weekFrom || req.query.weekTo) {
    filter.weekStart = {};
    if (req.query.weekFrom) filter.weekStart.$gte = new Date(req.query.weekFrom);
    if (req.query.weekTo) filter.weekStart.$lte = new Date(req.query.weekTo);
  }

  const { page, limit, skip } = parsePagination(req.query);
  const [reports, total] = await Promise.all([
    Report.find(filter)
      .populate("project", "name")
      .sort({ weekStart: -1 })
      .skip(skip)
      .limit(limit),
    Report.countDocuments(filter),
  ]);

  res.json({ reports, meta: buildPaginationMeta({ page, limit, total }) });
}

async function listAllReports(req, res) {
  // Draft reports are only ever visible to their owner, even to managers -
  // never let a status filter (or its absence) leak one into this list.
  const filter = { status: req.query.status && req.query.status !== "draft" ? req.query.status : { $ne: "draft" } };
  if (req.query.user) filter.user = req.query.user;
  if (req.query.project) filter.project = req.query.project;
  if (req.query.weekFrom || req.query.weekTo) {
    filter.weekStart = {};
    if (req.query.weekFrom) filter.weekStart.$gte = new Date(req.query.weekFrom);
    if (req.query.weekTo) filter.weekStart.$lte = new Date(req.query.weekTo);
  }

  const { page, limit, skip } = parsePagination(req.query);
  const [reports, total] = await Promise.all([
    Report.find(filter)
      .populate("user", "name email")
      .populate("project", "name")
      .populate("reviewHistory.reviewer", "name")
      .sort({ weekStart: -1 })
      .skip(skip)
      .limit(limit),
    Report.countDocuments(filter),
  ]);

  res.json({ reports, meta: buildPaginationMeta({ page, limit, total }) });
}

async function reviewReport(req, res) {
  const { action, comment } = req.body;

  const report = await Report.findById(req.params.id);
  if (!report) return res.status(404).json({ error: "Report not found" });
  if (report.status !== "submitted") {
    return res.status(409).json({ error: "Only a submitted report can be reviewed" });
  }

  const latestVersion = report.versions[report.versions.length - 1];
  report.status = action === "approve" ? "approved" : "needs_correction";
  report.reviewComment = comment;
  report.reviewHistory.push({
    action: action === "approve" ? "approved" : "requested_changes",
    comment,
    reviewer: req.user._id,
    versionId: latestVersion ? latestVersion._id : null,
    reviewedAt: new Date(),
  });

  await report.save();
  res.json({ report });
}

async function listVersions(req, res) {
  const report = await Report.findById(req.params.id).populate("reviewHistory.reviewer", "name email");
  if (!report) return res.status(404).json({ error: "Report not found" });

  const owner = isOwner(report, req.user);
  const canManagerView = req.user.role === "manager" && report.status !== "draft";
  if (!owner && !canManagerView) {
    return res.status(403).json({ error: "You can only view your own reports" });
  }

  res.json({ versions: report.versions, reviewHistory: report.reviewHistory });
}

module.exports = {
  createReport,
  updateReport,
  submitReport,
  getReport,
  listMyReports,
  listAllReports,
  reviewReport,
  listVersions,
};
