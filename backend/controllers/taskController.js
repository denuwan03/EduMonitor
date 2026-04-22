const Task = require("../models/Task");
const User = require("../models/User");

const calculateMatch = (requiredSkills, student) => {
  const req = requiredSkills.map((s) => s.toLowerCase());
  const studentSkills = (student.skills || []).map((s) => s.toLowerCase());
  const matches = req.filter((skill) => studentSkills.includes(skill)).length;
  const skillMatch = req.length ? (matches / req.length) * 50 : 0;
  const availability = Math.max(0, 30 - student.workload * 5);
  const workload = Math.max(0, 20 - student.workload * 3);
  const score = skillMatch + availability + workload;
  return {
    score: Number(score.toFixed(2)),
    details: {
      skillMatch: Number(skillMatch.toFixed(2)),
      availability: Number(availability.toFixed(2)),
      workload: Number(workload.toFixed(2)),
    },
    skillGap: req.filter((skill) => !studentSkills.includes(skill)),
  };
};

exports.createTask = async (req, res, next) => {
  try {
    const { requiredSkills = [] } = req.body;
    const students = await User.find({ role: "Student" });
    const scored = students
      .map((student) => ({ student, ...calculateMatch(requiredSkills, student) }))
      .sort((a, b) => b.score - a.score);
    const best = scored[0];
    const task = await Task.create({
      ...req.body,
      assignedTo: best?.student?._id,
      smartAssignment: best
        ? {
            suggestedStudent: best.student._id,
            score: best.score,
            details: best.details,
            skillGap: best.skillGap,
          }
        : undefined,
    });
    if (best?.student) {
      best.student.workload += 1;
      await best.student.save();
    }
    return res.status(201).json(task);
  } catch (error) {
    return next(error);
  }
};

exports.getTasks = async (req, res, next) => {
  try {
    const query = req.user.role === "Student" ? { assignedTo: req.user._id } : {};
    const tasks = await Task.find(query).populate("assignedTo", "name email skills").populate("projectId");
    return res.json(tasks);
  } catch (error) {
    return next(error);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (req.user.role === "Student") {
      if (!task.assignedTo || task.assignedTo.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Access Denied" });
      }
      const requestedKeys = Object.keys(req.body || {});
      const onlyStatus = requestedKeys.length > 0 && requestedKeys.every((key) => key === "status");
      if (!onlyStatus) {
        return res.status(403).json({ message: "Students can only update task progress" });
      }
      if (!["Pending", "In Progress", "Submitted", "Completed"].includes(req.body.status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      task.status = req.body.status;
      await task.save();
      return res.json(task);
    }

    if (!["Admin", "Supervisor"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access Denied" });
    }

    const allowedPayload = {};
    if (typeof req.body.title !== "undefined") allowedPayload.title = req.body.title;
    if (typeof req.body.description !== "undefined") allowedPayload.description = req.body.description;
    if (typeof req.body.requiredSkills !== "undefined") allowedPayload.requiredSkills = req.body.requiredSkills;
    if (typeof req.body.assignedTo !== "undefined") allowedPayload.assignedTo = req.body.assignedTo;
    if (typeof req.body.deadline !== "undefined") allowedPayload.deadline = req.body.deadline;
    if (typeof req.body.priority !== "undefined") allowedPayload.priority = req.body.priority;
    if (typeof req.body.status !== "undefined") allowedPayload.status = req.body.status;
    if (typeof req.body.projectId !== "undefined") allowedPayload.projectId = req.body.projectId;

    const updatedTask = await Task.findByIdAndUpdate(req.params.id, allowedPayload, { new: true })
      .populate("assignedTo", "name email skills")
      .populate("projectId");
    return res.json(updatedTask);
  } catch (error) {
    return next(error);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    await task.deleteOne();
    return res.json({ message: "Task deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

exports.getSkillGapAnalysis = async (_req, res, next) => {
  try {
    const tasks = await Task.find().populate("assignedTo", "name skills");
    const analysis = tasks.map((task) => ({
      taskId: task._id,
      taskTitle: task.title,
      requiredSkills: task.requiredSkills,
      assignedStudent: task.assignedTo?.name || "Unassigned",
      missingSkills: task.smartAssignment?.skillGap || [],
      matchScore: task.smartAssignment?.score || 0,
    }));
    return res.json(analysis);
  } catch (error) {
    return next(error);
  }
};
