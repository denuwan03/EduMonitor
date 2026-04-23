const Submission = require("../models/Submission");
const Task = require("../models/Task");
const User = require("../models/User");
const XLSX = require("xlsx");
const path = require("path");

const SUBMISSION_PREFIX = "SUB";
const SUBMISSION_PAD = 4;
const ALLOWED_FILE_EXTENSIONS = [".pdf", ".doc", ".docx", ".zip"];
const SUBMISSION_STATUSES = ["Submitted", "Reviewed", "Changes Requested"];

const generateSubmissionId = async () => {
  const latest = await Submission.findOne({ submissionId: { $exists: true, $ne: null } })
    .sort({ submissionId: -1 })
    .select("submissionId");

  if (!latest?.submissionId) {
    return `${SUBMISSION_PREFIX}${String(1).padStart(SUBMISSION_PAD, "0")}`;
  }

  const current = Number(latest.submissionId.replace(SUBMISSION_PREFIX, "")) || 0;
  const next = current + 1;
  return `${SUBMISSION_PREFIX}${String(next).padStart(SUBMISSION_PAD, "0")}`;
};

const buildSubmissionQuery = (req) => {
  const { search, status } = req.query;
  const query = {};

  if (req.user.role === "Student") {
    query.student_id = req.user._id;
  }

  if (status && SUBMISSION_STATUSES.includes(status)) {
    query.status = status;
  }

  if (search) {
    const regex = new RegExp(search, "i");
    query.$or = [{ studentName: regex }, { studentUserId: regex }];
  }

  return query;
};

const fetchSubmissions = async (query) =>
  Submission.find(query)
    .populate("task_id", "title")
    .populate("project_id", "title")
    .populate("student_id", "name userId email")
    .populate("evaluatedBy", "name userId")
    .sort({ submissionDate: -1 });

const getValidatedFile = (file) => {
  if (!file) return { valid: false, message: "file is required" };
  const ext = path.extname(file.originalname || "").toLowerCase();
  if (!ALLOWED_FILE_EXTENSIONS.includes(ext)) {
    return { valid: false, message: "Only PDF, DOC, DOCX, ZIP files allowed" };
  }
  return { valid: true };
};

const validateSubmissionPayload = ({ body, file, isUpdate = false }) => {
  const errors = [];
  const requiredFields = ["title", "description", "project_id", "task_id"];
  requiredFields.forEach((field) => {
    if (!body[field] || !String(body[field]).trim()) {
      errors.push(`${field} is required`);
    }
  });

  if (!isUpdate || file) {
    const fileValidation = getValidatedFile(file);
    if (!fileValidation.valid) errors.push(fileValidation.message);
  }

  return errors;
};

exports.submitTask = async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      project_id: req.body.project_id || req.body.projectId,
      task_id: req.body.task_id || req.body.taskId,
    };
    const validationErrors = validateSubmissionPayload({ body: payload, file: req.file });
    if (validationErrors.length) {
      return res.status(400).json({ message: "Validation failed", errors: validationErrors });
    }

    const task = await Task.findById(payload.task_id).populate("projectId", "title");
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (!task.projectId?._id) {
      return res.status(400).json({ message: "Task is not linked to a valid project" });
    }
    if (String(task.projectId._id) !== String(payload.project_id)) {
      return res.status(400).json({ message: "task_id does not belong to project_id" });
    }

    const submissionId = await generateSubmissionId();
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const studentProfile = req.user?.name
      ? { name: req.user.name, userId: req.user.userId || "" }
      : await User.findById(req.user._id).select("name userId");

    if (!studentProfile?.name) {
      return res.status(400).json({ message: "Student profile is incomplete. Missing name." });
    }

    const projectName = task.projectId?.title || "Untitled Project";
    const taskName = task.title || "Untitled Task";

    const submission = await Submission.create({
      submissionId,
      project_id: payload.project_id,
      task_id: payload.task_id,
      student_id: req.user._id,
      title: String(payload.title).trim(),
      description: String(payload.description).trim(),
      studentName: studentProfile.name,
      studentUserId: studentProfile.userId || "",
      projectName,
      taskName,
      file: req.file.filename,
      file_url: `${baseUrl}/uploads/${req.file.filename}`,
      originalName: req.file.originalname,
      status: "Submitted",
      version: 1,
    });

    await Task.findByIdAndUpdate(payload.task_id, { status: "Submitted" });
    return res.status(201).json(submission);
  } catch (error) {
    return next(error);
  }
};

exports.getSubmissions = async (req, res, next) => {
  try {
    const query = buildSubmissionQuery(req);
    const submissions = await fetchSubmissions(query);
    return res.json(submissions);
  } catch (error) {
    return next(error);
  }
};

exports.getPendingSubmissions = async (req, res, next) => {
  try {
    const query = { ...buildSubmissionQuery(req), status: { $in: ["Submitted", "Changes Requested"] } };
    const submissions = await fetchSubmissions(query);
    return res.json(submissions);
  } catch (error) {
    return next(error);
  }
};

exports.getEvaluatedSubmissions = async (req, res, next) => {
  try {
    const query = { ...buildSubmissionQuery(req), status: "Reviewed" };
    const submissions = await fetchSubmissions(query);
    return res.json(submissions);
  } catch (error) {
    return next(error);
  }
};

exports.evaluateSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { marks, grade, comments } = req.body;

    if (marks === undefined || grade === undefined) {
      return res.status(400).json({ message: "marks and grade are required" });
    }

    const numericMarks = Number(marks);
    if (Number.isNaN(numericMarks) || numericMarks < 0 || numericMarks > 100) {
      return res.status(400).json({ message: "marks must be between 0 and 100" });
    }

    const submission = await Submission.findById(id);
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    submission.marks = numericMarks;
    submission.grade = String(grade).trim();
    submission.comments = comments || "";
    submission.status = "Reviewed";
    submission.evaluatedBy = req.user._id;
    await submission.save();
    await Task.findByIdAndUpdate(submission.task_id, { status: "Completed" });

    return res.json({ message: "Submission evaluated successfully", submission });
  } catch (error) {
    return next(error);
  }
};

exports.exportSubmissions = async (req, res, next) => {
  try {
    const query = buildSubmissionQuery(req);
    const rows = await fetchSubmissions(query);

    const exportRows = rows.map((item) => ({
      "Student Name": item.studentName || item.studentId?.name || "",
      "Student ID": item.studentId?.userId || "",
      "Project Name": item.projectName || item.projectId?.title || "",
      "Task Name": item.taskName || item.taskId?.title || "",
      Title: item.title || "",
      Description: item.description || "",
      Version: item.version || 1,
      Marks: item.marks ?? "",
      Grade: item.grade || "",
      Comments: item.comments || "",
      "Submission Date": item.submissionDate ? new Date(item.submissionDate).toLocaleString() : "",
      Status: item.status || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    const filename = `submissions-report-${Date.now()}.xlsx`;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    return res.send(buffer);
  } catch (error) {
    return next(error);
  }
};

exports.getSubmissionById = async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate("task_id", "title description")
      .populate("project_id", "title description")
      .populate("student_id", "name userId email")
      .populate("evaluatedBy", "name userId");

    if (!submission) return res.status(404).json({ message: "Submission not found" });
    if (req.user.role === "Student" && String(submission.student_id?._id || submission.student_id) !== String(req.user._id)) {
      return res.status(403).json({ message: "You are not allowed to view this submission" });
    }

    return res.json(submission);
  } catch (error) {
    return next(error);
  }
};

exports.updateSubmission = async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ message: "Submission not found" });
    if (req.user.role === "Student" && String(submission.student_id) !== String(req.user._id)) {
      return res.status(403).json({ message: "You are not allowed to update this submission" });
    }

    const payload = {
      ...req.body,
      project_id: req.body.project_id || req.body.projectId || String(submission.project_id),
      task_id: req.body.task_id || req.body.taskId || String(submission.task_id),
    };

    const validationErrors = validateSubmissionPayload({ body: payload, file: req.file, isUpdate: true });
    if (validationErrors.length) {
      return res.status(400).json({ message: "Validation failed", errors: validationErrors });
    }

    const task = await Task.findById(payload.task_id).populate("projectId", "title");
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (String(task.projectId?._id || "") !== String(payload.project_id)) {
      return res.status(400).json({ message: "task_id does not belong to project_id" });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    submission.project_id = payload.project_id;
    submission.task_id = payload.task_id;
    submission.title = String(payload.title).trim();
    submission.description = String(payload.description).trim();
    submission.projectName = task.projectId?.title || submission.projectName;
    submission.taskName = task.title || submission.taskName;

    if (req.file) {
      submission.file = req.file.filename;
      submission.file_url = `${baseUrl}/uploads/${req.file.filename}`;
      submission.originalName = req.file.originalname;
    }

    submission.status = "Submitted";
    submission.version = (submission.version || 1) + 1;
    await submission.save();
    await Task.findByIdAndUpdate(payload.task_id, { status: "Submitted" });

    return res.json({ message: "Submission updated successfully", submission });
  } catch (error) {
    return next(error);
  }
};

exports.deleteSubmission = async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    const isOwner = String(submission.student_id) === String(req.user._id);
    const isPrivileged = ["Supervisor", "Admin"].includes(req.user.role);

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ message: "You are not allowed to delete this submission" });
    }

    await Submission.findByIdAndDelete(req.params.id);
    return res.json({ message: "Submission deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

exports.getSubmissionAnalytics = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const submissions = await Submission.find({ student_id: studentId });
    const tasks = await Task.find({}).populate("projectId", "title");

    // 1. Completion percentage per task
    // (Simplified: if a submission exists for a task, it's "Completed" for this student)
    const taskCompletion = tasks.map((task) => {
      const sub = submissions.find((s) => String(s.task_id) === String(task._id));
      return {
        taskName: task.title,
        status: sub ? sub.status : "Pending",
        project: task.projectId?.title || "Unknown",
        completion: sub && sub.status === "Reviewed" ? 100 : sub ? 50 : 0,
      };
    });

    // 2. Avg submission time & Productivity trends
    // Mocking some data for trends if not enough records
    const productivityTrends = submissions.map((s) => ({
      date: new Date(s.submissionDate || s.createdAt).toLocaleDateString(),
      version: s.version || 1,
      edits: s.edit_count || 0,
    }));

    // 3. Late vs On-time %
    let onTime = 0;
    let late = 0;
    submissions.forEach((s) => {
      if (s.deadline && s.submission_time) {
        if (new Date(s.submission_time) <= new Date(s.deadline)) onTime++;
        else late++;
      } else {
        // Default mock if no deadline/time exists
        onTime++;
      }
    });

    const total = submissions.length || 1;
    const pieData = [
      { name: "On-time", value: Math.round((onTime / total) * 100) },
      { name: "Late", value: Math.round((late / total) * 100) },
    ];

    // Readiness indicator (mocked for simplicity based on completion of all tasks)
    const overallCompletion = total > 0 ? (submissions.filter(s => s.status === 'Reviewed').length / tasks.length) * 100 : 0;

    return res.json({
      taskCompletion,
      productivityTrends,
      lateVsOnTime: pieData,
      overallReadiness: Math.min(Math.round(overallCompletion), 100),
      avgSubmissionTime: total > 0 ? (submissions.reduce((acc, s) => acc + (s.time_spent || 0), 0) / total).toFixed(1) : 0,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getProofScore = async (req, res, next) => {
  try {
    const { submissionId: id } = req.params;
    const submission = await Submission.findById(id);

    if (!submission) return res.status(404).json({ message: "Submission not found" });

    // Weightage logic: Time spent (30%), Edits made (30%), Consistency (40%)
    // Normalized scores (out of 100)
    const timeSpentScore = Math.min((submission.time_spent / 120) * 100, 100); // 120 mins as baseline
    const editsScore = Math.min((submission.edit_count / 10) * 100, 100); // 10 edits as baseline
    const consistencyScore = submission.consistency_score || 85; 

    const finalScore = Math.round(
      timeSpentScore * 0.3 + editsScore * 0.3 + consistencyScore * 0.4
    );

    return res.json({
      submissionId: id,
      finalScore,
      breakdown: [
        { name: "Time spent", value: 30 },
        { name: "Edits made", value: 30 },
        { name: "Consistency", value: 40 },
      ],
      details: {
        timeSpent: submission.time_spent,
        edits: submission.edit_count,
        consistency: consistencyScore,
      }
    });
  } catch (error) {
    return next(error);
  }
};
