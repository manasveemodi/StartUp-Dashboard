const mongoose = require("mongoose");

const actionItemSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  assignee: { type: String, trim: true },
  dueDate: { type: Date },
  done: { type: Boolean, default: false },
  completedAt: { type: Date },
}, { _id: true });

const noteSchema = new mongoose.Schema(
  {
    meetingId: { type: mongoose.Schema.Types.ObjectId, ref: "Meeting", index: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", index: true },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    content: { type: String, required: true },
    topic: { type: String, trim: true },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium", index: true },
    actionItems: [actionItemSchema],
    tags: [{ type: String, trim: true }],
    isPinned: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isDeleted: { type: Boolean, default: false },
    editHistory: [{
      content: String,
      editedAt: { type: Date, default: Date.now },
      editedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    }],
  },
  { timestamps: true }
);

noteSchema.index({ meetingId: 1, createdAt: -1 });
noteSchema.index({ title: "text", content: "text", topic: "text" });
noteSchema.index({ isPinned: -1, createdAt: -1 });

noteSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) this.where({ isDeleted: { $ne: true } });
  next();
});

module.exports = mongoose.model("Note", noteSchema);
