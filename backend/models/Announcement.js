const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    announcementId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => `ANN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdByRole: { type: String, enum: ["Admin", "Supervisor"], required: true },
    targetRole: { type: String, enum: ["All", "Student", "Supervisor"], default: "All" },
    createdDate: { type: Date, default: Date.now },
    updatedDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

announcementSchema.pre("save", function updateDates() {
  this.updatedDate = new Date();
  if (!this.createdDate) this.createdDate = new Date();
});

module.exports = mongoose.model("Announcement", announcementSchema);
