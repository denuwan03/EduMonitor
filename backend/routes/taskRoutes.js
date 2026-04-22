const express = require("express");
const {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  getSkillGapAnalysis,
} = require("../controllers/taskController");
const { protect, allowRoles, requireAdminOrSupervisor } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getTasks);
router.post("/", protect, allowRoles("Supervisor", "Admin"), createTask);
router.put("/:id", protect, updateTask);
router.delete("/:id", protect, requireAdminOrSupervisor, deleteTask);
router.get("/skill-gap/analysis", protect, allowRoles("Supervisor", "Admin"), getSkillGapAnalysis);

module.exports = router;
