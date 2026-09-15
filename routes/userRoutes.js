const express = require("express");
const {
  createUser,
  listUsers,
  updateUserRole,
  removeUser,
  reactivateUser,
} = require("../controllers/userController");
const { authenticate, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { createUserSchema } = require("../validators/userValidators");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();

router.use(authenticate, authorize("manager"));

router.get("/", asyncHandler(listUsers));
router.post("/", validate(createUserSchema), asyncHandler(createUser));
router.patch("/:id/role", asyncHandler(updateUserRole));
router.patch("/:id/reactivate", asyncHandler(reactivateUser));
router.delete("/:id", asyncHandler(removeUser));

module.exports = router;
