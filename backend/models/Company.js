const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true, maxlength: 200 },
    industry:    { type: String, trim: true },
    website:     { type: String, trim: true },
    email:       { type: String, trim: true, lowercase: true },
    phone:       { type: String, trim: true },
    address:     { type: String, trim: true },
    description: { type: String, trim: true, maxlength: 1000 },

    status: { 
      type: String, 
      enum: ["active","inactive","prospect","client"], 
      default: "active", 
      index: true 
    },

    tags: [{ type: String, trim: true, lowercase: true }],

    // ✅ FIXED: Added required + reference to User
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User",
      required: true
    },

    isDeleted: { type: Boolean, default: false, index: true },

    // Aggregated time spent (seconds)
    totalTimeSpent: { type: Number, default: 0 },
    meetingCount:   { type: Number, default: 0 },
  },
  { timestamps: true }
);

// 🔍 Text search index
companySchema.index({ name: "text", industry: "text" });

// 🚫 Auto-hide deleted records
companySchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

module.exports = mongoose.model("Company", companySchema);