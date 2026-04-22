const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    submissionId: { type: String, unique: true, index: true, sparse: true },
    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      alias: "projectId",
    },
    task_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      alias: "taskId",
    },
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      alias: "studentId",
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    studentName: { type: String, required: true },
    studentUserId: { type: String, default: "" },
    projectName: { type: String, required: true },
    taskName: { type: String, required: true },
    file: { type: String, required: true },
    file_url: { type: String, required: true, alias: "fileUrl" },
    originalName: { type: String, required: true },
    submissionDate: { type: Date, default: Date.now, alias: "submittedAt" },
    status: {
      type: String,
      enum: ["Submitted", "Reviewed", "Changes Requested"],
      default: "Submitted",
    },
    version: { type: Number, default: 1, min: 1 },
    marks: { type: Number, default: null, min: 0, max: 100 },
    grade: { type: String, default: "" },
    comments: { type: String, default: "" },
    evaluatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // New Fields for Analytics & Proof Score
    edit_count: { type: Number, default: 0 },
    time_spent: { type: Number, default: 0 }, // in minutes
    submission_time: { type: Date },
    deadline: { type: Date },
    consistency_score: { type: Number, default: 0 },
    activity_log: [
      {
        action: { type: String },
        timestamp: { type: Date, default: Date.now },
        duration: { type: Number }, // duration of activity session in minutes
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Submission", submissionSchema);
