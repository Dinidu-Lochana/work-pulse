const express = require("express");
const {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");
const { authenticate, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { createProjectSchema, updateProjectSchema } = require("../validators/projectValidators");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();

router.use(authenticate);

router.get("/", asyncHandler(listProjects));
router.post("/", authorize("manager"), validate(createProjectSchema), asyncHandler(createProject));
router.put("/:id", authorize("manager"), validate(updateProjectSchema), asyncHandler(updateProject));
router.delete("/:id", authorize("manager"), asyncHandler(deleteProject));

module.exports = router;
