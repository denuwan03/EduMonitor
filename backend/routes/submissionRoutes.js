const express = require("express");
const {
  submitTask,
  getSubmissions,
  getSubmissionById,
  updateSubmission,
  deleteSubmission,
  getPendingSubmissions,
  getEvaluatedSubmissions,
  evaluateSubmission,
  exportSubmissions,
  getSubmissionAnalytics,
  getProofScore,
} = require("../controllers/submissionController");
const { protect, allowRoles } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// Collection routes
router.get("/", protect, getSubmissions);
router.post("/", protect, upload.single("file"), submitTask);

// Specific named sub-routes (must come before /:id)
router.get("/pending", protect, allowRoles("Supervisor"), getPendingSubmissions);
router.get("/evaluated", protect, allowRoles("Supervisor"), getEvaluatedSubmissions);
router.get("/export", protect, allowRoles("Supervisor"), exportSubmissions);
router.get("/analytics", protect, getSubmissionAnalytics);
router.get("/proof-score/:submissionId", protect, allowRoles("Supervisor"), getProofScore);
router.put("/evaluate/:id", protect, allowRoles("Supervisor"), evaluateSubmission);

// Individual resource routes
router.get("/:id", protect, getSubmissionById);
router.put("/:id", protect, upload.single("file"), updateSubmission);
router.delete("/:id", protect, deleteSubmission);

module.exports = router;
