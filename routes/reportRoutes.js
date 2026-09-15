const express = require("express");
const {
  createReport,
  updateReport,
  submitReport,
  getReport,
  listMyReports,
  listAllReports,
  reviewReport,
  listVersions,
} = require("../controllers/reportController");
const { authenticate, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const {
  createReportSchema,
  updateReportSchema,
  reviewReportSchema,
} = require("../validators/reportValidators");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();

router.use(authenticate);

router.get("/mine", authorize("team_member"), asyncHandler(listMyReports));
router.get("/", authorize("manager"), asyncHandler(listAllReports));

router.post("/", authorize("team_member"), validate(createReportSchema), asyncHandler(createReport));
router.put(
  "/:id",
  authorize("team_member"),
  validate(updateReportSchema),
  asyncHandler(updateReport),
);
router.post("/:id/submit", authorize("team_member"), asyncHandler(submitReport));
router.post(
  "/:id/review",
  authorize("manager"),
  validate(reviewReportSchema),
  asyncHandler(reviewReport),
);

router.get("/:id/versions", asyncHandler(listVersions));
router.get("/:id", asyncHandler(getReport));

module.exports = router;
