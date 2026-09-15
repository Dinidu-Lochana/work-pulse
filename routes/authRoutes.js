const express = require("express");
const { register, login, logout, me } = require("../controllers/authController");
const { validate } = require("../middleware/validate");
const { registerSchema, loginSchema } = require("../validators/authValidators");
const { authenticate } = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();

router.post("/register", validate(registerSchema), asyncHandler(register));
router.post("/login", validate(loginSchema), asyncHandler(login));
router.post("/logout", asyncHandler(logout));
router.get("/me", authenticate, asyncHandler(me));

module.exports = router;
