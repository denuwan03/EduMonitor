const mongoose = require("mongoose");
const User = require("../models/User");
const Project = require("../models/Project");
const Task = require("../models/Task");
const Submission = require("../models/Submission");

const canViewStudentAnalytics = (viewer, studentId) =>
  viewer.role === "Admin" ||
  viewer.role === "Supervisor" ||
  (viewer.role === "Student" && viewer._id.toString() === studentId.toString());

exports.getStudents = async (req, res, next) => {
  try {
    const { search = "" } = req.query;
    const query = { role: "Student" };
    if (search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ name: regex }, { userId: regex }];
    }

    const students = await User.find(query).select("_id name userId email status").sort({ name: 1 });
    return res.json(students);
  } catch (error) {
    return next(error);
  }
};

exports.getStudentAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid student id" });
    }

    if (!canViewStudentAnalytics(req.user, id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const student = await User.findOne({ _id: id, role: "Student" }).select("_id name userId email");
    if (!student) return res.status(404).json({ message: "Student not found" });

    const [assignedProjects, completedTasks, pendingTasks, submissionStats] = await Promise.all([
      Project.countDocuments({ teamMembers: student._id }),
      Task.countDocuments({ assignedTo: student._id, status: "Completed" }),
      Task.countDocuments({
        assignedTo: student._id,
        status: { $in: ["Pending", "In Progress", "Submitted"] },
      }),
      Submission.aggregate([
        { $match: { studentId: student._id } },
        {
          $group: {
            _id: null,
            averageMarks: { $avg: "$marks" },
            evaluatedCount: {
              $sum: {
                $cond: [{ $eq: ["$status", "Evaluated"] }, 1, 0],
              },
            },
            totalSubmissions: { $sum: 1 },
          },
        },
      ]),
    ]);

    const marksAvg = submissionStats[0]?.averageMarks || 0;
    const evaluatedCount = submissionStats[0]?.evaluatedCount || 0;
    const totalSubmissions = submissionStats[0]?.totalSubmissions || 0;
    const completionRatio = totalSubmissions ? (evaluatedCount / totalSubmissions) * 100 : 0;
    const performanceScore = Number(((marksAvg * 0.7) + (completionRatio * 0.3)).toFixed(2));

    return res.json({
      student,
      analytics: {
        assignedProjects,
        completedTasks,
        pendingTasks,
        performanceScore,
        averageMarks: Number(marksAvg.toFixed(2)),
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.getProjectStatus = async (_req, res, next) => {
  try {
    const delayedProjects = await Task.distinct("projectId", {
      deadline: { $lt: new Date() },
      status: { $ne: "Completed" },
    });

    const [completed, ongoing, pending] = await Promise.all([
      Project.countDocuments({ status: "Completed" }),
      Project.countDocuments({ status: { $in: ["Ongoing", "Active"] } }),
      Project.countDocuments({ status: "On Hold" }),
    ]);

    return res.json({
      completed,
      ongoing,
      pending,
      delayed: delayedProjects.filter(Boolean).length,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getPerformanceAnalytics = async (_req, res, next) => {
  try {
    const students = await User.find({ role: "Student" }).select("_id name userId");
    const studentIds = students.map((student) => student._id);

    const [submissionStats, taskCompletionAgg, projectProgressAgg] = await Promise.all([
      Submission.aggregate([
        { $match: { studentId: { $in: studentIds } } },
        {
          $group: {
            _id: "$studentId",
            averageMarks: { $avg: "$marks" },
            evaluatedCount: {
              $sum: {
                $cond: [{ $eq: ["$status", "Evaluated"] }, 1, 0],
              },
            },
            totalSubmissions: { $sum: 1 },
          },
        },
      ]),
      Task.aggregate([{ $group: { _id: "$status", value: { $sum: 1 } } }]),
      Project.aggregate([{ $group: { _id: "$status", value: { $sum: 1 } } }]),
    ]);

    const submissionMap = new Map(submissionStats.map((row) => [row._id.toString(), row]));
    const performance = students.map((student) => {
      const stat = submissionMap.get(student._id.toString());
      const marks = stat?.averageMarks || 0;
      const completionRatio = stat?.totalSubmissions
        ? ((stat.evaluatedCount || 0) / stat.totalSubmissions) * 100
        : 0;
      return {
        studentId: student._id,
        studentName: student.name,
        userId: student.userId || "",
        averageMarks: Number(marks.toFixed(2)),
        performanceScore: Number(((marks * 0.7) + (completionRatio * 0.3)).toFixed(2)),
      };
    });

    const taskCompletion = {
      completed: taskCompletionAgg.find((item) => item._id === "Completed")?.value || 0,
      submitted: taskCompletionAgg.find((item) => item._id === "Submitted")?.value || 0,
      inProgress: taskCompletionAgg.find((item) => item._id === "In Progress")?.value || 0,
      pending: taskCompletionAgg.find((item) => item._id === "Pending")?.value || 0,
    };

    const projectProgress = {
      completed: projectProgressAgg.find((item) => item._id === "Completed")?.value || 0,
      ongoing:
        (projectProgressAgg.find((item) => item._id === "Active")?.value || 0) +
        (projectProgressAgg.find((item) => item._id === "Ongoing")?.value || 0),
      pending: projectProgressAgg.find((item) => item._id === "On Hold")?.value || 0,
    };

    return res.json({ performance, taskCompletion, projectProgress });
  } catch (error) {
    return next(error);
  }
};
