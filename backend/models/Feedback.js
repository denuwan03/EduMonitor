const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true, unique: true },
    supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    marks: { type: Number, required: true, min: 0, max: 100 },
    comments: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);
