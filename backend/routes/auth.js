const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { asyncHandler, AppError } = require("../middleware/errorHandler");
const { protect } = require("../middleware/auth");
const validators = require("../middleware/validators");
const ApiResponse = require("../utils/apiResponse");
const logger = require("../utils/logger");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

// POST /api/auth/register
router.post("/register", validators.register, asyncHandler(async (req, res) => {
  const { name, email, password, department } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new AppError("Email already registered", 409);

  const user = await User.create({ name, email, password, department });
  const token = signToken(user._id);

  logger.info(`New user registered: ${email}`);
  ApiResponse.created(res, { token, user }, "Account created successfully");
}));

// POST /api/auth/login
router.post("/login", validators.login, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.correctPassword(password))) {
    throw new AppError("Invalid email or password", 401);
  }
  if (!user.isActive) throw new AppError("Account is deactivated. Contact admin.", 401);

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = signToken(user._id);
  logger.info(`User logged in: ${email}`);
  ApiResponse.success(res, { token, user }, "Login successful");
}));

// GET /api/auth/me
router.get("/me", protect, asyncHandler(async (req, res) => {
  ApiResponse.success(res, req.user, "Profile retrieved");
}));

// PATCH /api/auth/me
router.patch("/me", protect, asyncHandler(async (req, res) => {
  const allowed = ["name", "department", "avatar"];
  const updates = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  ApiResponse.success(res, user, "Profile updated");
}));

// PATCH /api/auth/change-password
router.patch("/change-password", protect, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new AppError("Provide current and new password", 400);
  if (newPassword.length < 8) throw new AppError("New password must be at least 8 characters", 400);

  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.correctPassword(currentPassword))) throw new AppError("Current password is incorrect", 401);

  user.password = newPassword;
  await user.save();
  ApiResponse.success(res, null, "Password changed successfully");
}));

module.exports = router;
