const express = require("express");
const { chat } = require("../controllers/assistantController");
const { authenticate, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { chatSchema } = require("../validators/assistantValidators");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();

router.use(authenticate, authorize("manager"));

router.post("/chat", validate(chatSchema), asyncHandler(chat));

module.exports = router;
