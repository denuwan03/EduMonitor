const express = require("express");
const { createProject, getProjects, updateProject, deleteProject } = require("../controllers/projectController");
const { protect, requireAdminOrSupervisor } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getProjects);
router.post("/", protect, requireAdminOrSupervisor, createProject);
router.put("/:id", protect, requireAdminOrSupervisor, updateProject);
router.delete("/:id", protect, requireAdminOrSupervisor, deleteProject);

module.exports = router;
