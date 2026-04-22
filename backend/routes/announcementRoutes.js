const express = require("express");
const {
  createAnnouncement,
  getAnnouncements,
  getLatestAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
} = require("../controllers/announcementController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getAnnouncements);
router.get("/latest", protect, getLatestAnnouncements);
router.post("/", protect, allowRoles("Admin", "Supervisor"), createAnnouncement);
router.put("/:id", protect, allowRoles("Admin", "Supervisor"), updateAnnouncement);
router.delete("/:id", protect, allowRoles("Admin"), deleteAnnouncement);

module.exports = router;
