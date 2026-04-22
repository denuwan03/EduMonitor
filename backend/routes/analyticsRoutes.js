const express = require("express");
const {
  getStudents,
  getStudentAnalytics,
  getProjectStatus,
  getPerformanceAnalytics,
} = require("../controllers/analyticsController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/students", protect, allowRoles("Supervisor", "Admin"), getStudents);
router.get("/student/:id", protect, getStudentAnalytics);
router.get("/project-status", protect, allowRoles("Supervisor", "Admin"), getProjectStatus);
router.get("/performance", protect, allowRoles("Supervisor", "Admin"), getPerformanceAnalytics);

module.exports = router;
