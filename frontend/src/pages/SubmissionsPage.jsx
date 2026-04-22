import { useCallback, useEffect, useRef, useState } from "react";
import api from "../services/api";
import {
  fetchSubmissions,
  fetchSubmissionById,
  createSubmission,
  updateSubmission,
  deleteSubmission,
} from "../services/submissionService";
import { useAuth } from "../context/AuthContext";
import SubmissionDashboard from "../components/submissions/SubmissionDashboard";
import ProofScoreCard from "../components/submissions/ProofScoreCard";

// ─── Constants ──────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = ".pdf,.doc,.docx,.zip";
const ALLOWED_LABEL = "PDF, DOC, DOCX, ZIP";

const STATUS_CONFIG = {
  Submitted: {
    badge: "bg-blue-100 text-blue-700 border border-blue-200",
    dot: "bg-blue-500",
  },
  Reviewed: {
    badge: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    dot: "bg-emerald-500",
  },
  "Changes Requested": {
    badge: "bg-amber-100 text-amber-700 border border-amber-200",
    dot: "bg-amber-500",
  },
};

const FILTER_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "Submitted", label: "Submitted" },
  { value: "Reviewed", label: "Reviewed" },
  { value: "Changes Requested", label: "Changes Requested" },
];

const EMPTY_FORM = { project_id: "", task_id: "", title: "", description: "", file: null };

// ─── Sub-components ──────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || {
    badge: "bg-slate-100 text-slate-600 border border-slate-200",
    dot: "bg-slate-400",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
};

const ValidationErrors = ({ errors }) =>
  errors.length > 0 ? (
    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      <p className="mb-1 font-semibold">Please fix the following:</p>
      <ul className="list-inside list-disc space-y-0.5">
        {errors.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
    </div>
  ) : null;

// ─── Detail Modal ─────────────────────────────────────────────────────────────

const DetailModal = ({ submission, onClose, onResubmit, isStudent }) => {
  if (!submission) return null;

  const projectName = submission.project_id?.title || submission.projectName || "—";
  const taskName = submission.task_id?.title || submission.taskName || "—";
  const evaluatorName = submission.evaluatedBy?.name || null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-4 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">{submission.title}</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              ID: {submission.submissionId || submission._id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Status + Version row */}
        <div className="mb-4 flex items-center gap-3">
          <StatusBadge status={submission.status} />
          <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
            v{submission.version || 1}
          </span>
        </div>

        {/* Info grid */}
        <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
          <div>
            <p className="text-xs font-medium text-slate-500">Project</p>
            <p className="font-medium text-slate-800">{projectName}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Task</p>
            <p className="font-medium text-slate-800">{taskName}</p>
          </div>
          {submission.studentName && (
            <div>
              <p className="text-xs font-medium text-slate-500">Student</p>
              <p className="font-medium text-slate-800">{submission.studentName}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-slate-500">Submitted</p>
            <p className="font-medium text-slate-800">
              {new Date(submission.submissionDate || submission.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="mb-4">
          <p className="mb-1 text-xs font-medium text-slate-500">Description</p>
          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700 leading-relaxed">
            {submission.description}
          </p>
        </div>

        {/* Evaluation section */}
        {submission.status === "Reviewed" && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
            <p className="mb-2 font-semibold text-emerald-800">Evaluation Result</p>
            <div className="flex items-center gap-4">
              {submission.marks !== null && submission.marks !== undefined && (
                <div>
                  <p className="text-xs text-emerald-600">Marks</p>
                  <p className="text-xl font-bold text-emerald-700">{submission.marks}/100</p>
                </div>
              )}
              {submission.grade && (
                <div>
                  <p className="text-xs text-emerald-600">Grade</p>
                  <p className="text-xl font-bold text-emerald-700">{submission.grade}</p>
                </div>
              )}
            </div>
            {submission.comments && (
              <div className="mt-2">
                <p className="text-xs text-emerald-600">Comments</p>
                <p className="mt-0.5 text-emerald-800">{submission.comments}</p>
              </div>
            )}
            {evaluatorName && (
              <p className="mt-2 text-xs text-emerald-600">Evaluated by {evaluatorName}</p>
            )}
          </div>
        )}

        {submission.status === "Changes Requested" && submission.comments && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
            <p className="mb-1 font-semibold text-amber-800">Feedback from Supervisor</p>
            <p className="text-amber-700">{submission.comments}</p>
          </div>
        )}

        {/* File link */}
        {submission.file_url && (
          <a
            href={submission.file_url}
            target="_blank"
            rel="noreferrer"
            className="mb-4 flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-medium text-violet-700 hover:bg-violet-100 transition-colors"
          >
            📎 View / Download Uploaded File
            <span className="ml-auto text-xs text-violet-400">({submission.originalName || "file"})</span>
          </a>
        )}

        {/* Proof Score for Supervisor */}
        {!isStudent && <ProofScoreCard submissionId={submission._id} />}

        {/* Actions */}
        <div className="flex gap-2">
          {isStudent && submission.status === "Changes Requested" && (
            <button
              onClick={() => { onResubmit(submission); onClose(); }}
              className="flex-1 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
            >
              Resubmit Now
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────

const SubmissionsPage = () => {
  const { user } = useAuth();
  const isStudent = user?.role === "Student";
  const isSupervisor = user?.role === "Supervisor";

  // State
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState("");
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailModal, setDetailModal] = useState(null);
  const [loadingDetailId, setLoadingDetailId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const fileInputRef = useRef(null);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [taskRes, subData] = await Promise.all([
        api.get("/tasks").then((r) => r.data),
        fetchSubmissions(statusFilter ? { status: statusFilter } : {}),
      ]);
      setTasks(taskRes);
      setSubmissions(subData);
    } catch {
      // silently fail – list shows empty
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Flash success message
  const flash = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  // Reset form
  const resetForm = () => {
    setEditingId("");
    setFormData(EMPTY_FORM);
    setErrors([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Validate form
  const validate = () => {
    const errs = [];
    if (!formData.task_id) errs.push("Task is required.");
    if (!formData.project_id) errs.push("Project could not be resolved from selected task.");
    if (!formData.title.trim()) errs.push("Title is required.");
    if (!formData.description.trim()) errs.push("Description is required.");
    if (!editingId && !formData.file) errs.push("File is required for a new submission.");
    if (formData.file) {
      const ext = formData.file.name.split(".").pop().toLowerCase();
      if (!["pdf", "doc", "docx", "zip"].includes(ext)) {
        errs.push(`File type ".${ext}" is not allowed. Use: ${ALLOWED_LABEL}.`);
      }
    }
    setErrors(errs);
    return errs.length === 0;
  };

  // Task change → auto-fill project
  const handleTaskChange = (taskId) => {
    const task = tasks.find((t) => t._id === taskId);
    setFormData((prev) => ({
      ...prev,
      task_id: taskId,
      project_id: task?.projectId?._id || task?.projectId || "",
    }));
  };

  // Submit / resubmit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const fd = new FormData();
    fd.append("project_id", formData.project_id);
    fd.append("task_id", formData.task_id);
    fd.append("title", formData.title.trim());
    fd.append("description", formData.description.trim());
    if (formData.file) fd.append("file", formData.file);

    setSubmitting(true);
    try {
      if (editingId) {
        await updateSubmission(editingId, fd);
        flash("Submission updated successfully.");
      } else {
        await createSubmission(fd);
        flash("Submission created successfully.");
      }
      resetForm();
      await loadData();
    } catch (err) {
      const apiErrors =
        err.response?.data?.errors ||
        [err.response?.data?.message || "Submission failed. Please try again."];
      setErrors(apiErrors);
    } finally {
      setSubmitting(false);
    }
  };

  // View detail
  const handleView = async (id) => {
    setLoadingDetailId(id);
    try {
      const data = await fetchSubmissionById(id);
      setDetailModal(data);
    } catch {
      setErrors(["Could not load submission details."]);
    } finally {
      setLoadingDetailId("");
    }
  };

  // Start resubmit
  const handleStartResubmit = (sub) => {
    setEditingId(sub._id);
    setFormData({
      project_id: sub.project_id?._id || sub.project_id || "",
      task_id: sub.task_id?._id || sub.task_id || "",
      title: sub.title || "",
      description: sub.description || "",
      file: null,
    });
    setErrors([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this submission? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteSubmission(id);
      flash("Submission deleted.");
      setSubmissions((prev) => prev.filter((s) => s._id !== id));
      if (detailModal?._id === id) setDetailModal(null);
    } catch {
      setErrors(["Could not delete submission."]);
    } finally {
      setDeletingId("");
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Submissions</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {isStudent
              ? "Submit your project tasks and track their status."
              : "Review all student submissions."}
          </p>
        </div>
        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          {FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Analytics Dashboard (Student side only) */}
      {isStudent && <SubmissionDashboard />}

      {/* Success toast */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <span>✓</span> {successMsg}
        </div>
      )}

      {/* ── SUBMISSION FORM (Students only) ──────────────────────────────── */}
      {isStudent && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white text-sm">
              {editingId ? "↑" : "+"}
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {editingId ? "Resubmit / Update Submission" : "New Submission"}
            </h3>
            {editingId && (
              <span className="ml-auto rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                Editing
              </span>
            )}
          </div>

          <ValidationErrors errors={errors} />

          <form onSubmit={handleSubmit} className="mt-3 space-y-4" noValidate>
            {/* Task selector */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Task <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.task_id}
                onChange={(e) => handleTaskChange(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100"
              >
                <option value="">Select a task…</option>
                {tasks.map((task) => (
                  <option key={task._id} value={task._id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Submission Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Phase 1 Report – Literature Review"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                maxLength={120}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100"
              />
              <p className="mt-1 text-right text-xs text-slate-400">{formData.title.length}/120</p>
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Briefly describe what this submission covers…"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                maxLength={600}
                className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100"
              />
              <p className="mt-1 text-right text-xs text-slate-400">
                {formData.description.length}/600
              </p>
            </div>

            {/* File upload */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                File Upload{" "}
                {!editingId && <span className="text-red-500">*</span>}
                {editingId && <span className="text-slate-400">(leave blank to keep existing file)</span>}
              </label>
              <div className="relative flex items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 hover:border-violet-400 hover:bg-violet-50 transition-colors">
                <span className="text-2xl">📁</span>
                <div className="flex-1 min-w-0">
                  {formData.file ? (
                    <p className="truncate text-sm font-medium text-violet-700">{formData.file.name}</p>
                  ) : (
                    <p className="text-sm text-slate-400">
                      Click to choose a file · {ALLOWED_LABEL}
                    </p>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES}
                  onChange={(e) => setFormData((p) => ({ ...p, file: e.target.files[0] || null }))}
                  required={!editingId}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-violet-700 disabled:opacity-60 transition-colors"
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {editingId ? "Updating…" : "Uploading…"}
                  </>
                ) : editingId ? (
                  "Update Submission"
                ) : (
                  "Upload Submission"
                )}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ── SUBMISSION HISTORY TABLE ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="font-bold text-slate-800">
            {isStudent ? "My Submission History" : "All Submissions"}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {submissions.length} record{submissions.length !== 1 ? "s" : ""}
            {statusFilter ? ` · filtered by "${statusFilter}"` : ""}
          </p>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
              <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-violet-500" />
              Loading submissions…
            </div>
          ) : submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 text-5xl">📭</div>
              <p className="text-base font-semibold text-slate-600">No submissions found</p>
              <p className="mt-1 text-sm text-slate-400">
                {statusFilter
                  ? `No submissions with status "${statusFilter}".`
                  : isStudent
                  ? "Use the form above to make your first submission."
                  : "No student submissions yet."}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Title</th>
                  {!isStudent && <th className="px-4 py-3">Student</th>}
                  <th className="px-4 py-3">Task</th>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3 text-center">Ver.</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {submissions.map((sub) => (
                  <tr
                    key={sub._id}
                    className="group hover:bg-slate-50 transition-colors"
                  >
                    {/* Title */}
                    <td className="px-4 py-3">
                      <p className="max-w-[180px] truncate font-medium text-slate-800" title={sub.title}>
                        {sub.title}
                      </p>
                      <p className="text-xs text-slate-400">{sub.submissionId || ""}</p>
                    </td>

                    {/* Student (Supervisor view) */}
                    {!isStudent && (
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-700">{sub.studentName || sub.student_id?.name || "—"}</p>
                        <p className="text-xs text-slate-400">{sub.student_id?.userId || ""}</p>
                      </td>
                    )}

                    {/* Task / Project */}
                    <td className="px-4 py-3 text-slate-600">
                      {sub.task_id?.title || sub.taskName || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {sub.project_id?.title || sub.projectName || "—"}
                    </td>

                    {/* Version */}
                    <td className="px-4 py-3 text-center">
                      <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-bold text-violet-600">
                        v{sub.version || 1}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={sub.status} />
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(sub.submissionDate || sub.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {/* View */}
                        <button
                          onClick={() => handleView(sub._id)}
                          disabled={loadingDetailId === sub._id}
                          className="rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-60 transition-colors"
                        >
                          {loadingDetailId === sub._id ? "…" : "View"}
                        </button>

                        {/* Resubmit (student) */}
                        {isStudent && (
                          <button
                            onClick={() => handleStartResubmit(sub)}
                            className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
                          >
                            Resubmit
                          </button>
                        )}

                        {/* Delete (student owns it, or supervisor/admin) */}
                        {(isStudent || isSupervisor || user?.role === "Admin") && (
                          <button
                            onClick={() => handleDelete(sub._id)}
                            disabled={deletingId === sub._id}
                            className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-60 transition-colors"
                          >
                            {deletingId === sub._id ? "…" : "Delete"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Detail Modal ────────────────────────────────────────────────── */}
      <DetailModal
        submission={detailModal}
        onClose={() => setDetailModal(null)}
        onResubmit={handleStartResubmit}
        isStudent={isStudent}
      />
    </div>
  );
};

export default SubmissionsPage;
