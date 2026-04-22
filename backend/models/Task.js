const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    requiredSkills: [{ type: String }],
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Submitted", "Completed"],
      default: "Pending",
    },
    deadline: { type: Date, required: true },
    priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    smartAssignment: {
      suggestedStudent: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      score: { type: Number, default: 0 },
      details: {
        skillMatch: { type: Number, default: 0 },
        availability: { type: Number, default: 0 },
        workload: { type: Number, default: 0 },
      },
      skillGap: [{ type: String }],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
