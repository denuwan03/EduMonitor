const express = require("express");
const { getReports } = require("../controllers/reportController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, allowRoles("Supervisor", "Admin"), getReports);

module.exports = router;
