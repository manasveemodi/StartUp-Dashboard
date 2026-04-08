const express = require("express");
const router = express.Router();
const Meeting = require("../models/Meeting");
const Note = require("../models/Note");
const Recording = require("../models/Recording");
const { asyncHandler, AppError } = require("../middleware/errorHandler");
const { protect } = require("../middleware/auth");
const validators = require("../middleware/validators");
const ApiResponse = require("../utils/apiResponse");
const logger = require("../utils/logger");

// GET /api/meetings/stats/overview
// UPDATED: Robust action item counting and user filtering
router.get("/stats/overview", protect, asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Base filter to reuse for all counts
  const userFilter = { createdBy: userId, isDeleted: { $ne: true } };

  const [
    totalMeetings, completedMeetings, ongoingMeetings, scheduledMeetings,
    totalNotes, totalRecordings,
    recentMeetings,
  ] = await Promise.all([
    Meeting.countDocuments(userFilter),
    Meeting.countDocuments({ ...userFilter, status: "completed" }),
    Meeting.countDocuments({ ...userFilter, status: "ongoing" }),
    Meeting.countDocuments({ ...userFilter, status: "scheduled" }),
    Note.countDocuments(userFilter),
    Recording.countDocuments(userFilter),
    Meeting.find(userFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title status createdAt priority company"),
  ]);

  // Meetings per status for chart
  const meetingsByStatus = { 
    scheduled: scheduledMeetings, 
    ongoing: ongoingMeetings, 
    completed: completedMeetings 
  };

  // Notes by priority
  const [highNotes, medNotes, lowNotes] = await Promise.all([
    Note.countDocuments({ ...userFilter, priority: "high" }),
    Note.countDocuments({ ...userFilter, priority: "medium" }),
    Note.countDocuments({ ...userFilter, priority: "low" }),
  ]);

  // --- ACTION ITEMS COMPLETION RATE (FIXED) ---
  const notesWithActions = await Note.find({ 
    ...userFilter, 
    "actionItems.0": { $exists: true } 
  }).select("actionItems");

  let totalActions = 0, doneActions = 0;

  notesWithActions.forEach(n => { 
    if (n.actionItems && Array.isArray(n.actionItems)) {
      totalActions += n.actionItems.length; 
      // Check for 'done' OR 'completed' status to match various schema styles
      doneActions += n.actionItems.filter(a => a.done === true || a.completed === true).length; 
    }
  });

  // Log to backend console for verification
  console.log(`[Stats] User: ${req.user.email} | Total Actions: ${totalActions} | Done: ${doneActions}`);

  ApiResponse.success(res, {
    counts: { 
      totalMeetings, 
      completedMeetings, 
      ongoingMeetings, 
      scheduledMeetings, 
      totalNotes, 
      totalRecordings 
    },
    meetingsByStatus,
    notesByPriority: { high: highNotes, medium: medNotes, low: lowNotes },
    actionItems: { 
      total: totalActions, 
      done: doneActions, 
      rate: totalActions ? Math.round((doneActions / totalActions) * 100) : 0 
    },
    recentMeetings,
  });
}));

// GET /api/meetings — with pagination, filtering, search
router.get("/", protect, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, priority, search, sortBy = "createdAt", sortOrder = "desc", tags } = req.query;
  
  const filter = { createdBy: req.user._id, isDeleted: { $ne: true } };
  
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (tags) filter.tags = { $in: tags.split(",").map(t => t.trim().toLowerCase()) };
  if (search) filter.$text = { $search: search };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [meetings, total] = await Promise.all([
    Meeting.find(filter).sort(sort).skip(skip).limit(parseInt(limit)).populate("createdBy", "name email avatar"),
    Meeting.countDocuments(filter),
  ]);

  ApiResponse.paginated(res, meetings, {
    total, page: parseInt(page), limit: parseInt(limit),
    pages: Math.ceil(total / parseInt(limit)),
    hasNext: skip + meetings.length < total,
    hasPrev: parseInt(page) > 1,
  });
}));

// POST /api/meetings
router.post("/", protect, validators.createMeeting, asyncHandler(async (req, res) => {
  const meeting = await Meeting.create({ ...req.body, createdBy: req.user._id });
  logger.info(`Meeting created: ${meeting._id} by ${req.user.email}`);
  ApiResponse.created(res, meeting, "Meeting created successfully");
}));

// GET /api/meetings/:id
router.get("/:id", protect, validators.mongoId, asyncHandler(async (req, res) => {
  const meeting = await Meeting.findOne({ _id: req.params.id, createdBy: req.user._id, isDeleted: { $ne: true } })
    .populate("createdBy", "name email avatar");
    
  if (!meeting) throw new AppError("Meeting not found", 404);

  const [notes, recordings] = await Promise.all([
    Note.find({ meetingId: req.params.id, isDeleted: { $ne: true } }).sort({ isPinned: -1, createdAt: -1 }).populate("createdBy", "name avatar"),
    Recording.find({ meetingId: req.params.id, isDeleted: { $ne: true } }).sort({ createdAt: -1 }).populate("createdBy", "name avatar"),
  ]);

  ApiResponse.success(res, { meeting, notes, recordings });
}));

// PATCH /api/meetings/:id
router.patch("/:id", protect, validators.updateMeeting, asyncHandler(async (req, res) => {
  const meeting = await Meeting.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.user._id, isDeleted: { $ne: true } },
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );
  if (!meeting) throw new AppError("Meeting not found", 404);
  logger.info(`Meeting updated: ${meeting._id} by ${req.user.email}`);
  ApiResponse.success(res, meeting, "Meeting updated");
}));

// DELETE /api/meetings/:id — soft delete
router.delete("/:id", protect, validators.mongoId, asyncHandler(async (req, res) => {
  const meeting = await Meeting.findOne({ _id: req.params.id, createdBy: req.user._id });
  if (!meeting) throw new AppError("Meeting not found", 404);

  await Meeting.findByIdAndUpdate(req.params.id, {
    isDeleted: true, deletedAt: new Date(), deletedBy: req.user._id,
  });
  
  await Promise.all([
    Note.updateMany({ meetingId: req.params.id }, { isDeleted: true }),
    Recording.updateMany({ meetingId: req.params.id }, { isDeleted: true }),
  ]);
  
  logger.info(`Meeting soft-deleted: ${req.params.id} by ${req.user.email}`);
  ApiResponse.success(res, null, "Meeting deleted");
}));

module.exports = router;