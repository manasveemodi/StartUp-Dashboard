const mongoose = require("mongoose");

// Tracks time spent on a company per visit/session
const timeSessionSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true, index: true },
    startedAt: { type: Date, default: Date.now },
    endedAt:   { type: Date },
    duration:  { type: Number, default: 0 }, // seconds
    isActive:  { type: Boolean, default: true },
  },
  { timestamps: true }
);

timeSessionSchema.index({ companyId: 1, userId: 1, isActive: 1 });

module.exports = mongoose.model("TimeSession", timeSessionSchema);
