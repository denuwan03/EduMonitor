const User = require("../models/User");
const Project = require("../models/Project");
const Task = require("../models/Task");
const Feedback = require("../models/Feedback");

exports.getReports = async (_req, res, next) => {
  try {
    const [users, projects, tasks, feedback] = await Promise.all([
      User.find(),
      Project.find(),
      Task.find(),
      Feedback.find(),
    ]);

    const taskCompletion = {
      completed: tasks.filter((t) => t.status === "Completed").length,
      submitted: tasks.filter((t) => t.status === "Submitted").length,
      inProgress: tasks.filter((t) => t.status === "In Progress").length,
      pending: tasks.filter((t) => t.status === "Pending").length,
    };

    const avgMarks =
      feedback.length > 0
        ? Number((feedback.reduce((sum, item) => sum + item.marks, 0) / feedback.length).toFixed(2))
        : 0;

    const roleCounts = users.reduce(
      (acc, user) => ({ ...acc, [user.role]: (acc[user.role] || 0) + 1 }),
      {}
    );

    return res.json({
      systemSummary: {
        users: users.length,
        projects: projects.length,
        tasks: tasks.length,
      },
      roleCounts,
      taskCompletion,
      avgMarks,
    });
  } catch (error) {
    return next(error);
  }
};
