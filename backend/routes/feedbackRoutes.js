const express = require("express");
const { upsertFeedback, getFeedback } = require("../controllers/feedbackController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getFeedback);
router.post("/", protect, allowRoles("Supervisor", "Admin"), upsertFeedback);

module.exports = router;
