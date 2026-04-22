const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    userId: { type: String, unique: true, index: true, sparse: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["Student", "Supervisor", "Admin"], default: "Student" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    skills: [{ type: String }],
    workload: { type: Number, default: 0 },
    profile: {
      department: { type: String, default: "" },
      bio: { type: String, default: "" },
      phone: { type: String, default: "" },
    },
    activityLog: [
      {
        action: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
