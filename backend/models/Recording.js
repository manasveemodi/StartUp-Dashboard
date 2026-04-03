const mongoose = require("mongoose");

const recordingSchema = new mongoose.Schema(
  {
    meetingId: { type: mongoose.Schema.Types.ObjectId, ref: "Meeting", index: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", index: true },
    filename: { type: String, required: true },
    originalName: { type: String },
    duration: { type: Number, default: 0 },
    fileSize: { type: Number, default: 0 },
    mimeType: { type: String, default: "audio/webm" },
    label: { type: String, trim: true },
    description: { type: String, trim: true },
    transcription: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

recordingSchema.index({ meetingId: 1, createdAt: -1 });

recordingSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) this.where({ isDeleted: { $ne: true } });
  next();
});

module.exports = mongoose.model("Recording", recordingSchema);
