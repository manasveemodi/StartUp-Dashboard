const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { asyncHandler, AppError } = require("../middleware/errorHandler");
const { protect, restrictTo } = require("../middleware/auth");
const ApiResponse = require("../utils/apiResponse");

// All routes require admin
router.use(protect, restrictTo("admin"));

// GET /api/admin/users
router.get("/users", asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, role } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (search) filter.$or = [
    { name: { $regex: search, $options: "i" } },
    { email: { $regex: search, $options: "i" } },
  ];
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    User.countDocuments(filter),
  ]);
  ApiResponse.paginated(res, users, { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) });
}));

// PATCH /api/admin/users/:id
router.patch("/users/:id", asyncHandler(async (req, res) => {
  const allowed = ["role", "isActive", "department"];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!user) throw new AppError("User not found", 404);
  ApiResponse.success(res, user, "User updated");
}));

// DELETE /api/admin/users/:id
router.delete("/users/:id", asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) throw new AppError("Cannot delete yourself", 400);
  await User.findByIdAndUpdate(req.params.id, { isActive: false });
  ApiResponse.success(res, null, "User deactivated");
}));

module.exports = router;
