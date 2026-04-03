const express   = require("express");
const router    = express.Router();
const multer    = require("multer");
const path      = require("path");
const fs        = require("fs");
const { v4: uuidv4 } = require("uuid");

const Recording = require("../models/Recording");
const Meeting   = require("../models/Meeting");
const Company   = require("../models/Company");

const { asyncHandler, AppError } = require("../middleware/errorHandler");
const { protect } = require("../middleware/auth");
const validators  = require("../middleware/validators");
const ApiResponse = require("../utils/apiResponse");


// ────────────────────────────────────────────────────────────
// FILE STORAGE CONFIG
// ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".webm";
    cb(null, `rec_${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 100) * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("audio/")) cb(null, true);
    else cb(new AppError("Only audio files are allowed", 400), false);
  },
});


// ────────────────────────────────────────────────────────────
// GET recordings by meeting
// ────────────────────────────────────────────────────────────
router.get("/meeting/:meetingId", protect, asyncHandler(async (req, res) => {

  const filter = { meetingId: req.params.meetingId };

  // ✅ ROLE FILTER
  if (req.user.role !== "admin") {
    filter.createdBy = req.user._id;
  }

  const recordings = await Recording.find(filter)
    .sort({ createdAt: -1 })
    .populate("createdBy","name avatar");

  ApiResponse.success(res, recordings);
}));


// ────────────────────────────────────────────────────────────
// GET recordings by company
// ────────────────────────────────────────────────────────────
router.get("/company/:companyId", protect, asyncHandler(async (req, res) => {

  const filter = { companyId: req.params.companyId };

  // ✅ ROLE FILTER
  if (req.user.role !== "admin") {
    filter.createdBy = req.user._id;
  }

  const recordings = await Recording.find(filter)
    .sort({ createdAt: -1 })
    .populate("createdBy","name avatar");

  ApiResponse.success(res, recordings);
}));


// ────────────────────────────────────────────────────────────
// UPLOAD recording
// ────────────────────────────────────────────────────────────
router.post("/upload", protect, upload.single("audio"), asyncHandler(async (req, res) => {

  if (!req.file) throw new AppError("No audio file provided", 400);

  const { meetingId, companyId } = req.body;

  if (!meetingId && !companyId) {
    throw new AppError("A meetingId or companyId is required", 400);
  }

  const recording = await Recording.create({
    meetingId:   meetingId   || undefined,
    companyId:   companyId   || undefined,
    filename:    req.file.filename,
    originalName:req.file.originalname,
    fileSize:    req.file.size,
    mimeType:    req.file.mimetype,
    label:       req.body.label || `Recording — ${new Date().toLocaleTimeString()}`,
    duration:    parseFloat(req.body.duration) || 0,
    description: req.body.description || "",
    createdBy:   req.user._id   // ✅ IMPORTANT
  });

  if (meetingId) {
    await Meeting.findByIdAndUpdate(meetingId, { $inc: { recordingCount: 1 } });
  }

  if (companyId) {
    await Company.findByIdAndUpdate(companyId, { $inc: { recordingCount: 1 } });
  }

  ApiResponse.created(res, recording, "Recording saved");
}));


// ────────────────────────────────────────────────────────────
// UPDATE recording (SECURED)
// ────────────────────────────────────────────────────────────
router.patch("/:id", protect, validators.mongoId, asyncHandler(async (req, res) => {

  const recording = await Recording.findById(req.params.id);
  if (!recording) throw new AppError("Recording not found", 404);

  // ✅ SECURITY CHECK
  if (
    req.user.role !== "admin" &&
    recording.createdBy.toString() !== req.user._id.toString()
  ) {
    throw new AppError("Not allowed to update this recording", 403);
  }

  const allowed = ["label","description","transcription"];
  const updates = {};

  allowed.forEach(f => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  const updated = await Recording.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true }
  );

  ApiResponse.success(res, updated, "Recording updated");
}));


// ────────────────────────────────────────────────────────────
// DELETE recording (SECURED)
// ────────────────────────────────────────────────────────────
router.delete("/:id", protect, validators.mongoId, asyncHandler(async (req, res) => {

  const recording = await Recording.findById(req.params.id);
  if (!recording) throw new AppError("Recording not found", 404);

  // ✅ SECURITY CHECK
  if (
    req.user.role !== "admin" &&
    recording.createdBy.toString() !== req.user._id.toString()
  ) {
    throw new AppError("Not allowed to delete this recording", 403);
  }

  // delete file
  const filePath = path.join(__dirname, "../uploads", recording.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await Recording.findByIdAndUpdate(req.params.id, { isDeleted: true });

  if (recording.meetingId) {
    await Meeting.findByIdAndUpdate(recording.meetingId, { $inc: { recordingCount: -1 } });
  }

  if (recording.companyId) {
    await Company.findByIdAndUpdate(recording.companyId, { $inc: { recordingCount: -1 } });
  }

  ApiResponse.success(res, null, "Recording deleted");
}));


module.exports = router;