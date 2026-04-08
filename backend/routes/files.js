const express = require("express");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// 🔥 TEMP STORAGE (in-memory)
let filesDB = [];

// 📦 Storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// ✅ Upload
router.post("/upload", upload.single("file"), (req, res) => {
  try {
    const { meetingId } = req.body;

    const newFile = {
      _id: Date.now().toString(),
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: `http://localhost:5000/uploads/${req.file.filename}`,
      meetingId,
      createdAt: new Date(),
      fileSize: req.file.size,
    };

    filesDB.push(newFile);

    res.json({ success: true, file: newFile });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ✅ Get files by meeting
router.get("/meeting/:meetingId", (req, res) => {
  const { meetingId } = req.params;

  const filtered = filesDB.filter(f => f.meetingId === meetingId);

  res.json(filtered);
});

// ✅ Delete
router.delete("/:id", (req, res) => {
  filesDB = filesDB.filter(f => f._id !== req.params.id);
  res.json({ success: true });
});

module.exports = router;