const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    participants:[ { type: String, trim: true } ],
    status:      { type: String, enum: ["scheduled","ongoing","completed","cancelled"], default: "scheduled", index: true },
    priority:    { type: String, enum: ["low","medium","high","critical"], default: "medium" },
    scheduledAt: { type: Date, index: true },
    endedAt:     { type: Date },
    duration:    { type: Number, default: 0 },   // minutes
    tags:        [ { type: String, trim: true, lowercase: true } ],
    category:    { type: String, trim: true },
    location:    { type: String, trim: true },
    // Company association (optional)
    companyId:   { type: mongoose.Schema.Types.ObjectId, ref: "Company", default: null, index: true },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isDeleted:   { type: Boolean, default: false, index: true },
    deletedAt:   { type: Date },
    noteCount:      { type: Number, default: 0 },
    recordingCount: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

meetingSchema.index({ createdAt: -1 });
meetingSchema.index({ status: 1, createdAt: -1 });
meetingSchema.index({ tags: 1 });
meetingSchema.index({ title: "text", description: "text" });

meetingSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) this.where({ isDeleted: { $ne: true } });
  next();
});

module.exports = mongoose.model("Meeting", meetingSchema);
