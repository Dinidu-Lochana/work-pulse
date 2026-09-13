const Report = require("../models/Report");
const { groqChatCompletion } = require("../utils/groq");

const LOOKBACK_DAYS = 84; // ~12 weeks of context
const MAX_REPORTS = 120;

function formatHours(hours) {
  if (!hours) return "none logged";
  const parts = Object.entries(hours)
    .filter(([, value]) => value > 0)
    .map(([type, value]) => `${type} ${value}h`);
  return parts.length ? parts.join(", ") : "none logged";
}

function formatReport(report) {
  const weekLabel = `${report.weekStart.toISOString().slice(0, 10)} to ${report.weekEnd
    .toISOString()
    .slice(0, 10)}`;
  const tasks = (report.tasksCompleted || [])
    .map((t) => `${t.name} [${t.status}, ${t.timeSpentHours}h]`)
    .join("; ") || "none";
  const planned = (report.tasksPlannedNextWeek || []).join("; ") || "none";
  const blockers =
    (report.blockers || [])
      .map((b) => (b.isKey ? `KEY BLOCKER: ${b.description}` : b.description))
      .join("; ") || "none";
  const achievements =
    (report.achievements || [])
      .map((a) => (a.isKey ? `KEY ACHIEVEMENT: ${a.description}` : a.description))
      .join("; ") || "none";

  return [
    `Team member: ${report.user?.name || "Unknown"}`,
    `Week: ${weekLabel}`,
    `Project: ${report.project?.name || "Unassigned"}`,
    `Status: ${report.status}`,
    `Tasks completed: ${tasks}`,
    `Planned next week: ${planned}`,
    `Blockers: ${blockers}`,
    `Achievements: ${achievements}`,
    `Hours by type: ${formatHours(report.hoursByTaskType)}`,
  ].join("\n");
}

async function buildReportContext() {
  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  // Same visibility rule as every other manager-facing report read: drafts
  // are never included, regardless of how old or recent they are.
  const reports = await Report.find({ status: { $ne: "draft" }, weekStart: { $gte: since } })
    .populate("user", "name")
    .populate("project", "name")
    .sort({ weekStart: -1 })
    .limit(MAX_REPORTS);

  if (reports.length === 0) {
    return "No submitted reports are available yet.";
  }

  return reports.map(formatReport).join("\n\n---\n\n");
}

const SYSTEM_PROMPT = `You are the WorkPulse assistant, helping a manager understand their team's weekly reports.
You will be given a set of recent weekly report entries as context. Answer the manager's question using ONLY that data.
Rules:
- Never invent facts, numbers, or names that are not present in the context.
- If the context does not contain enough information to answer, say so plainly instead of guessing.
- Be concise and specific: reference team member names, weeks, and numbers where relevant.
- When asked for a summary, organize it into short sections: completed work highlights, recurring blockers, and workload balance.`;

async function chat(req, res) {
  const { message, history } = req.body;

  const context = await buildReportContext();

  const messages = [
    { role: "system", content: `${SYSTEM_PROMPT}\n\nREPORT DATA:\n${context}` },
    ...history.map((entry) => ({ role: entry.role, content: entry.content })),
    { role: "user", content: message },
  ];

  const reply = await groqChatCompletion(messages);
  res.json({ reply });
}

module.exports = { chat };
