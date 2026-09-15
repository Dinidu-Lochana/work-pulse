const Project = require("../models/Project");

async function listProjects(req, res) {
  const filter = {};
  const includeInactive = req.query.includeInactive === "true" && req.user.role === "manager";
  if (!includeInactive) filter.isActive = true;

  const projects = await Project.find(filter).populate("members", "name email").sort({ name: 1 });
  res.json({ projects });
}

async function createProject(req, res) {
  const { name, description, members } = req.body;

  const existing = await Project.findOne({ name });
  if (existing) {
    return res.status(409).json({ error: "A project with this name already exists" });
  }

  const project = await Project.create({ name, description, members });
  res.status(201).json({ project });
}

async function updateProject(req, res) {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ error: "Project not found" });

  Object.assign(project, req.body);
  await project.save();
  res.json({ project });
}

async function deleteProject(req, res) {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ error: "Project not found" });

  project.isActive = false;
  await project.save();
  res.status(204).send();
}

module.exports = { listProjects, createProject, updateProject, deleteProject };
