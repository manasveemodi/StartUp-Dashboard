const express  = require("express");
const router   = express.Router();

const Note     = require("../models/Note");
const Meeting  = require("../models/Meeting");
const Company  = require("../models/Company");

const { asyncHandler, AppError } = require("../middleware/errorHandler");
const { protect } = require("../middleware/auth");
const validators  = require("../middleware/validators");
const ApiResponse = require("../utils/apiResponse");


// ── GET notes by meeting ─────────────────────────────────────
router.get("/meeting/:meetingId", protect, asyncHandler(async (req, res) => {
  const { priority, search, page = 1, limit = 50 } = req.query;

  const filter = { meetingId: req.params.meetingId };

  if (priority) filter.priority = priority;
  if (search)   filter.$text = { $search: search };

  if (req.user.role !== "admin") {
    filter.createdBy = req.user._id;
  }

  const skip = (parseInt(page)-1) * parseInt(limit);

  const [notes, total] = await Promise.all([
    Note.find(filter)
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("createdBy","name avatar")
      .populate("companyId", "name")
      // 🔥 FINAL FIX (NESTED POPULATE)
      .populate({
        path: "meetingId",
        select: "title companyId",
        populate: {
          path: "companyId",
          select: "name"
        }
      }),

    Note.countDocuments(filter),
  ]);

  ApiResponse.paginated(res, notes, {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total/parseInt(limit))
  });
}));


// ── GET notes by company ─────────────────────────────────────
router.get("/company/:companyId", protect, asyncHandler(async (req, res) => {
  const { priority, search, page = 1, limit = 50 } = req.query;

  const filter = { companyId: req.params.companyId };

  if (priority) filter.priority = priority;
  if (search)   filter.$text = { $search: search };

  if (req.user.role !== "admin") {
    filter.createdBy = req.user._id;
  }

  const skip = (parseInt(page)-1) * parseInt(limit);

  const [notes, total] = await Promise.all([
    Note.find(filter)
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("createdBy","name avatar")
      .populate("companyId", "name")
      // 🔥 FINAL FIX
      .populate({
        path: "meetingId",
        select: "title companyId",
        populate: {
          path: "companyId",
          select: "name"
        }
      }),

    Note.countDocuments(filter),
  ]);

  ApiResponse.paginated(res, notes, {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total/parseInt(limit))
  });
}));


// ── CREATE NOTE (AUTO COMPANY FIX) ───────────────────────────
router.post("/", protect, asyncHandler(async (req, res) => {
  let { meetingId, companyId, title, content } = req.body;

  if (!title?.trim()) throw new AppError("Note title is required", 400);
  if (!content?.trim()) throw new AppError("Note content is required", 400);
  if (!meetingId && !companyId) throw new AppError("A meetingId or companyId is required", 400);

  // 🔥 AUTO ASSIGN COMPANY FROM MEETING
  if (!companyId && meetingId) {
    const meeting = await Meeting.findById(meetingId).populate("companyId");
    if (meeting?.companyId) {
      companyId = meeting.companyId._id;
    }
  }

  const note = await Note.create({
    ...req.body,
    companyId, // ✅ FORCE SAVE
    createdBy: req.user._id
  });

  if (meetingId) await Meeting.findByIdAndUpdate(meetingId, { $inc: { noteCount: 1 } });
  if (companyId) await Company.findByIdAndUpdate(companyId, { $inc: { noteCount: 1 } });

  ApiResponse.created(res, note, "Note created");
}));


// ── UPDATE NOTE ─────────────────────────────────────────────
router.patch("/:id", protect, validators.mongoId, asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);

  if (!note) throw new AppError("Note not found", 404);

  if (
    req.user.role !== "admin" &&
    note.createdBy.toString() !== req.user._id.toString()
  ) {
    throw new AppError("Not allowed to update this note", 403);
  }

  if (req.body.content && req.body.content !== note.content) {
    await Note.findByIdAndUpdate(req.params.id, {
      $push: { editHistory: { content: note.content, editedBy: req.user._id } },
    });
  }

  const updated = await Note.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  )
  .populate("companyId", "name")
  .populate({
    path: "meetingId",
    select: "title companyId",
    populate: {
      path: "companyId",
      select: "name"
    }
  });

  ApiResponse.success(res, updated, "Note updated");
}));


// ── TOGGLE ACTION ITEM ───────────────────────────────────────
router.patch("/:id/action-items/:itemId", protect, asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);

  if (!note) throw new AppError("Note not found", 404);

  if (
    req.user.role !== "admin" &&
    note.createdBy.toString() !== req.user._id.toString()
  ) {
    throw new AppError("Not allowed", 403);
  }

  const item = note.actionItems.id(req.params.itemId);
  if (!item) throw new AppError("Action item not found", 404);

  item.done = !item.done;
  item.completedAt = item.done ? new Date() : undefined;

  await note.save();

  ApiResponse.success(res, note, "Action item updated");
}));


// ── PIN NOTE ────────────────────────────────────────────────
router.patch("/:id/pin", protect, validators.mongoId, asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);

  if (!note) throw new AppError("Note not found", 404);

  if (
    req.user.role !== "admin" &&
    note.createdBy.toString() !== req.user._id.toString()
  ) {
    throw new AppError("Not allowed", 403);
  }

  note.isPinned = !note.isPinned;
  await note.save();

  ApiResponse.success(res, note, note.isPinned ? "Note pinned" : "Note unpinned");
}));


// ── DELETE NOTE ─────────────────────────────────────────────
router.delete("/:id", protect, validators.mongoId, asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);

  if (!note) throw new AppError("Note not found", 404);

  if (
    req.user.role !== "admin" &&
    note.createdBy.toString() !== req.user._id.toString()
  ) {
    throw new AppError("Not allowed to delete this note", 403);
  }

  await Note.findByIdAndUpdate(req.params.id, { isDeleted: true });

  if (note.meetingId) {
    await Meeting.findByIdAndUpdate(note.meetingId, { $inc: { noteCount: -1 } });
  }

  if (note.companyId) {
    await Company.findByIdAndUpdate(note.companyId, { $inc: { noteCount: -1 } });
  }

  ApiResponse.success(res, null, "Note deleted");
}));


module.exports = router;