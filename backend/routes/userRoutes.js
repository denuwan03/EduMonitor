const express = require("express");
const {
  getProfile,
  updateProfile,
  getStudents,
  getUserActivity,
  getDashboardSummary,
  createUser,
  getUsers,
  updateUser,
  deleteUser,
  resetUserPassword,
} = require("../controllers/userController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.get("/students", protect, allowRoles("Supervisor", "Admin"), getStudents);
router.get("/activity", protect, allowRoles("Admin"), getUserActivity);
router.get("/dashboard-summary", protect, getDashboardSummary);
router.post("/create", protect, allowRoles("Admin"), createUser);
router.get("/", protect, allowRoles("Admin"), getUsers);
router.put("/:id", protect, allowRoles("Admin"), updateUser);
router.delete("/:id", protect, allowRoles("Admin"), deleteUser);
router.post("/reset-password", protect, allowRoles("Admin"), resetUserPassword);

module.exports = router;
