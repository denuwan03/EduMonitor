const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    supervisor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["Ongoing", "Completed", "On Hold", "Active"], default: "Ongoing" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
