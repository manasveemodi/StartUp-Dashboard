const express = require("express");
const router  = express.Router();

const Company     = require("../models/Company");
const Meeting     = require("../models/Meeting");
const Note        = require("../models/Note");
const Recording   = require("../models/Recording");
const TimeSession = require("../models/TimeSession");

const { asyncHandler, AppError } = require("../middleware/errorHandler");
const { protect } = require("../middleware/auth");
const ApiResponse  = require("../utils/apiResponse");


// ── GET all companies (ROLE BASED) ─────────────────────────────
router.get("/", protect, asyncHandler(async (req, res) => {
  const { search, status, page = 1, limit = 50 } = req.query;

  const filter = {};

  if (status) filter.status = status;
  if (search) filter.$text = { $search: search };

  // ✅ ROLE-BASED FILTER
  if (req.user.role !== "admin") {
    filter.createdBy = req.user._id;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [companies, total] = await Promise.all([
    Company.find(filter)
      .populate("createdBy", "name")
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit)),

    Company.countDocuments(filter),
  ]);

  ApiResponse.paginated(res, companies, {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total / parseInt(limit))
  });
}));


// ── POST create company ───────────────────────────
router.post("/", protect, asyncHandler(async (req, res) => {
  const { name, industry, website, email, phone, address, description, status, tags } = req.body;

  if (!name?.trim()) {
    throw new AppError("Company name is required", 400);
  }

  const company = await Company.create({
    name: name.trim(),
    industry,
    website,
    email,
    phone,
    address,
    description,
    status,
    tags,
    createdBy: req.user._id   // ✅ SAVE USER
  });

  ApiResponse.created(res, company, "Company registered successfully");
}));


// ── GET company detail (SECURED) ──────────────────────────────
router.get("/:id", protect, asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id)
                               .populate("createdBy", "name");

  if (!company) throw new AppError("Company not found", 404);

  // ✅ SECURITY
  if (
    req.user.role !== "admin" &&
    company.createdBy._id.toString() !== req.user._id.toString()
  ) {
    throw new AppError("Not authorized to view this company", 403);
  }

  const [meetings, totalTimeSessions] = await Promise.all([
    Meeting.find({ companyId: req.params.id }).sort({ createdAt: -1 }),
    TimeSession.find({ companyId: req.params.id, isActive: false }),
  ]);

  let grandTotal = 0;
  totalTimeSessions.forEach(s => {
    grandTotal += (s.duration || 0);
  });

  const meetingIds = meetings.map(m => m._id);

  const [notes, recordings] = await Promise.all([
    Note.find({ meetingId: { $in: meetingIds } }).sort({ createdAt: -1 }),
    Recording.find({ meetingId: { $in: meetingIds } }).sort({ createdAt: -1 }),
  ]);

  ApiResponse.success(res, { 
    company, 
    meetings, 
    notes, 
    recordings, 
    timeStats: { 
      totalSeconds: company.totalTimeSpent || grandTotal, 
      sessionCount: totalTimeSessions.length 
    } 
  });
}));


// ── UPDATE company (🔥 NEW SECURITY ADDED) ─────────────────────
router.patch("/:id", protect, asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);

  if (!company) throw new AppError("Company not found", 404);

  // ✅ SECURITY CHECK
  if (
    req.user.role !== "admin" &&
    company.createdBy.toString() !== req.user._id.toString()
  ) {
    throw new AppError("Not allowed to update this company", 403);
  }

  const updated = await Company.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  ApiResponse.success(res, updated, "Company updated");
}));


// ── DELETE company (🔥 NEW SECURITY ADDED) ─────────────────────
router.delete("/:id", protect, asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);

  if (!company) throw new AppError("Company not found", 404);

  // ✅ SECURITY CHECK
  if (
    req.user.role !== "admin" &&
    company.createdBy.toString() !== req.user._id.toString()
  ) {
    throw new AppError("Not allowed to delete this company", 403);
  }

  await Company.findByIdAndUpdate(req.params.id, { isDeleted: true });

  ApiResponse.success(res, null, "Company deleted");
}));


// ── START SESSION ─────────────────────────────────────────────
router.post("/:id/session/start", protect, asyncHandler(async (req, res) => {
  await TimeSession.updateMany(
    { companyId: req.params.id, userId: req.user._id, isActive: true },
    { isActive: false, endedAt: new Date(), duration: 0 }
  );

  const session = await TimeSession.create({ 
    companyId: req.params.id, 
    userId: req.user._id,
    startedAt: new Date(),
    isActive: true 
  });

  ApiResponse.created(res, session, "Session started");
}));


// ── END SESSION ───────────────────────────────────────────────
router.post("/:id/session/end", protect, asyncHandler(async (req, res) => {
  const { sessionId, elapsed } = req.body;

  if (!sessionId) throw new AppError("Session ID is required", 400);

  const session = await TimeSession.findOne({ 
    _id: sessionId, 
    companyId: req.params.id, 
    userId: req.user._id, 
    isActive: true 
  });

  if (!session) {
    return ApiResponse.success(res, null, "No active session found");
  }

  const duration = (elapsed !== undefined) 
    ? Number(elapsed) 
    : Math.max(0, Math.floor((Date.now() - new Date(session.startedAt)) / 1000));

  session.endedAt  = new Date();
  session.duration = duration;
  session.isActive = false;

  await session.save();

  await Company.findByIdAndUpdate(req.params.id, { 
    $inc: { totalTimeSpent: duration } 
  });

  ApiResponse.success(res, { duration }, "Session ended");
}));


// ── GET TIME ──────────────────────────────────────────────────
router.get("/:id/time", protect, asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);

  if (!company) throw new AppError("Company not found", 404);

  ApiResponse.success(res, { 
    totalSeconds: company.totalTimeSpent || 0, 
    name: company.name 
  });
}));


module.exports = router;