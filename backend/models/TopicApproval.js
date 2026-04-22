const mongoose = require("mongoose");

const topicApprovalSchema = new mongoose.Schema(
  {
    projectTitle: { type: String, required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TopicApproval", topicApprovalSchema);
