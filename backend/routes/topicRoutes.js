const express = require("express");
const {
  createTopicRequest,
  getTopicRequests,
  reviewTopic,
} = require("../controllers/topicController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, allowRoles("Student"), createTopicRequest);
router.get("/", protect, getTopicRequests);
router.put("/:id/review", protect, allowRoles("Supervisor", "Admin"), reviewTopic);

module.exports = router;
