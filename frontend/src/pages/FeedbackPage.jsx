import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const defaultEvaluation = { marks: "", grade: "", comments: "" };

const FeedbackPage = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [evaluatedSubmissions, setEvaluatedSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEvaluated, setLoadingEvaluated] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [evaluationForm, setEvaluationForm] = useState(defaultEvaluation);
  const [saving, setSaving] = useState(false);

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== "all") params.status = statusFilter;
      const { data } = await api.get("/submissions", { params });
      setSubmissions(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  const loadEvaluatedSubmissions = useCallback(async () => {
    if (user.role !== "Supervisor") return;
    setLoadingEvaluated(true);
    try {
      const { data } = await api.get("/submissions/evaluated");
      setEvaluatedSubmissions(data);
    } catch {
      // Keep primary UX responsive even if evaluated feed fails.
      setEvaluatedSubmissions([]);
    } finally {
      setLoadingEvaluated(false);
    }
  }, [user.role]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  useEffect(() => {
    loadEvaluatedSubmissions();
  }, [loadEvaluatedSubmissions]);

  const sortedSubmissions = useMemo(() => {
    const cloned = [...submissions];
    cloned.sort((a, b) => {
      const first = (a.studentName || a.studentId?.name || "").toLowerCase();
      const second = (b.studentName || b.studentId?.name || "").toLowerCase();
      if (sortOrder === "desc") return second.localeCompare(first);
      return first.localeCompare(second);
    });
    return cloned;
  }, [sortOrder, submissions]);

  const summary = useMemo(() => {
    const total = submissions.length;
    const pending = submissions.filter((item) => item.status === "Pending").length;
    const evaluated = submissions.filter((item) => item.status === "Evaluated").length;
    return { total, pending, evaluated };
  }, [submissions]);

  const selectSubmissionForEvaluation = (submission) => {
    setSelectedSubmission(submission);
    setEvaluationForm({
      marks: submission.marks ?? "",
      grade: submission.grade || "",
      comments: submission.comments || "",
    });
  };

  const saveEvaluation = async (e) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    setSaving(true);
    setError("");
    try {
      await api.put(`/submissions/evaluate/${selectedSubmission._id}`, {
        marks: Number(evaluationForm.marks),
        grade: evaluationForm.grade,
        comments: evaluationForm.comments,
      });
      setSelectedSubmission(null);
      setEvaluationForm(defaultEvaluation);
      await Promise.all([loadSubmissions(), loadEvaluatedSubmissions()]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save evaluation");
    } finally {
      setSaving(false);
    }
  };

  const exportReport = async (exportStatus) => {
    setError("");
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (exportStatus) params.status = exportStatus;

      const response = await api.get("/submissions/export", {
        params,
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `evaluation-report-${Date.now()}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to export report");
    }
  };

  const pendingSubmissions = useMemo(
    () => submissions.filter((item) => item.status !== "Evaluated"),
    [submissions]
  );

  if (user.role === "Student") {
    return (
      <div>
        <h2 className="text-2xl font-semibold">Evaluation & Feedback</h2>
        <p className="mt-1 text-sm text-slate-500">View comments, marks, and grades from your supervisor.</p>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="p-3">Project</th>
                <th className="p-3">Task</th>
                <th className="p-3">Status</th>
                <th className="p-3">Marks</th>
                <th className="p-3">Grade</th>
                <th className="p-3">Comments</th>
              </tr>
            </thead>
            <tbody>
              {sortedSubmissions.map((item) => (
                <tr key={item._id} className="border-t">
                  <td className="p-3">{item.projectName || item.projectId?.title || "-"}</td>
                  <td className="p-3">{item.taskName || item.taskId?.title || "-"}</td>
                  <td className="p-3">{item.status || "Pending"}</td>
                  <td className="p-3">{item.marks ?? "-"}</td>
                  <td className="p-3">{item.grade || "-"}</td>
                  <td className="p-3">{item.comments || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (user.role !== "Supervisor") {
    return (
      <div>
        <h2 className="text-2xl font-semibold">Evaluation & Feedback</h2>
        <p className="mt-2 text-sm text-slate-500">Read-only evaluation report view.</p>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="p-3">Student Name</th>
                <th className="p-3">Project</th>
                <th className="p-3">Task</th>
                <th className="p-3">Status</th>
                <th className="p-3">Marks</th>
                <th className="p-3">Grade</th>
                <th className="p-3">Comments</th>
              </tr>
            </thead>
            <tbody>
              {sortedSubmissions.map((item) => (
                <tr key={item._id} className="border-t">
                  <td className="p-3">{item.studentName || item.studentId?.name || "-"}</td>
                  <td className="p-3">{item.projectName || item.projectId?.title || "-"}</td>
                  <td className="p-3">{item.taskName || item.taskId?.title || "-"}</td>
                  <td className="p-3">{item.status || "Pending"}</td>
                  <td className="p-3">{item.marks ?? "-"}</td>
                  <td className="p-3">{item.grade || "-"}</td>
                  <td className="p-3">{item.comments || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold">Supervisor Evaluation Dashboard</h2>
        <p className="text-sm text-slate-500">Evaluate submissions, track progress, and export reports.</p>
      </div>

      {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</div>}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total Submissions</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{summary.total}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-sm text-amber-700">Pending Submissions</p>
          <p className="mt-2 text-3xl font-semibold text-amber-800">{summary.pending}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <p className="text-sm text-emerald-700">Evaluated Submissions</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-800">{summary.evaluated}</p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Submit Evaluation Feedback</h3>
        <p className="mt-1 text-sm text-slate-500">Select a submission, then add marks, grade, and comments.</p>

        <form onSubmit={saveEvaluation} className="mt-4 grid gap-3 md:grid-cols-2">
          <select
            className="rounded-lg border p-3 md:col-span-2"
            value={selectedSubmission?._id || ""}
            onChange={(e) => {
              const selected = submissions.find((item) => item._id === e.target.value) || null;
              if (!selected) {
                setSelectedSubmission(null);
                setEvaluationForm(defaultEvaluation);
                return;
              }
              selectSubmissionForEvaluation(selected);
            }}
            required
          >
            <option value="">Select submission</option>
            {pendingSubmissions.map((item) => (
              <option key={item._id} value={item._id}>
                {(item.studentName || item.studentId?.name || "Student")} -{" "}
                {item.taskName || item.taskId?.title || "Task"}
              </option>
            ))}
            {submissions
              .filter((item) => item.status === "Evaluated")
              .map((item) => (
                <option key={item._id} value={item._id}>
                  [Evaluated] {(item.studentName || item.studentId?.name || "Student")} -{" "}
                  {item.taskName || item.taskId?.title || "Task"}
                </option>
              ))}
          </select>

          <input
            className="rounded-lg border p-3"
            type="number"
            min="0"
            max="100"
            placeholder="Marks"
            required
            value={evaluationForm.marks}
            onChange={(e) => setEvaluationForm({ ...evaluationForm, marks: e.target.value })}
          />
          <input
            className="rounded-lg border p-3"
            placeholder="Grade (e.g. A, B+, C)"
            required
            value={evaluationForm.grade}
            onChange={(e) => setEvaluationForm({ ...evaluationForm, grade: e.target.value })}
          />
          <textarea
            className="rounded-lg border p-3 md:col-span-2"
            rows={4}
            placeholder="Comments"
            value={evaluationForm.comments}
            onChange={(e) => setEvaluationForm({ ...evaluationForm, comments: e.target.value })}
          />

          <div className="flex gap-2 md:col-span-2">
            <button disabled={saving} className="rounded-lg bg-violet-600 px-4 py-2 text-white">
              {saving ? "Saving..." : "Save Evaluation"}
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-4 py-2"
              onClick={() => {
                setSelectedSubmission(null);
                setEvaluationForm(defaultEvaluation);
              }}
            >
              Clear
            </button>
          </div>
        </form>
      </section>

      <div className="rounded-2xl border border-slate-200 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2 md:flex-row">
            <input
              className="rounded-lg border p-2"
              placeholder="Search by student name or student ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="rounded-lg border p-2"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="asc">Student Name (A-Z)</option>
              <option value="desc">Student Name (Z-A)</option>
            </select>
            <select
              className="rounded-lg border p-2"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Evaluated">Evaluated</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => exportReport("")}>
              Export All
            </button>
            <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => exportReport("Evaluated")}>
              Export Evaluated
            </button>
            <button className="rounded-lg bg-violet-600 px-3 py-2 text-sm text-white" onClick={() => exportReport(statusFilter === "all" ? "" : statusFilter)}>
              Export Filtered
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3">Student Name</th>
                <th className="p-3">Student ID</th>
                <th className="p-3">Project Name</th>
                <th className="p-3">Task Name</th>
                <th className="p-3">Submission Date</th>
                <th className="p-3">Status</th>
                <th className="p-3">Marks</th>
                <th className="p-3">Grade</th>
                <th className="p-3">Comments</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-4 text-center text-slate-500" colSpan={10}>
                    Loading submissions...
                  </td>
                </tr>
              ) : sortedSubmissions.length === 0 ? (
                <tr>
                  <td className="p-4 text-center text-slate-500" colSpan={10}>
                    No submissions found
                  </td>
                </tr>
              ) : (
                sortedSubmissions.map((item) => (
                  <tr key={item._id} className="border-t">
                    <td className="p-3">{item.studentName || item.studentId?.name || "-"}</td>
                    <td className="p-3">{item.studentId?.userId || "-"}</td>
                    <td className="p-3">{item.projectName || item.projectId?.title || "-"}</td>
                    <td className="p-3">{item.taskName || item.taskId?.title || "-"}</td>
                    <td className="p-3">{new Date(item.submissionDate).toLocaleDateString()}</td>
                    <td className="p-3">{item.status}</td>
                    <td className="p-3">{item.marks ?? "-"}</td>
                    <td className="p-3">{item.grade || "-"}</td>
                    <td className="p-3">{item.comments || "-"}</td>
                    <td className="p-3">
                      <button
                        className="rounded bg-emerald-600 px-2 py-1 text-xs text-white"
                        onClick={() => selectSubmissionForEvaluation(item)}
                      >
                        {item.status === "Evaluated" ? "Edit" : "Evaluate"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Evaluated Feedback Section</h3>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
            {evaluatedSubmissions.length} Evaluated
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          All saved marks, grades, and comments appear here after evaluation.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3">Student Name</th>
                <th className="p-3">Student ID</th>
                <th className="p-3">Project Name</th>
                <th className="p-3">Task Name</th>
                <th className="p-3">Marks</th>
                <th className="p-3">Grade</th>
                <th className="p-3">Comments</th>
                <th className="p-3">Evaluated Date</th>
              </tr>
            </thead>
            <tbody>
              {loadingEvaluated ? (
                <tr>
                  <td className="p-4 text-center text-slate-500" colSpan={8}>
                    Loading evaluated feedback...
                  </td>
                </tr>
              ) : evaluatedSubmissions.length === 0 ? (
                <tr>
                  <td className="p-4 text-center text-slate-500" colSpan={8}>
                    No evaluated feedback yet
                  </td>
                </tr>
              ) : (
                evaluatedSubmissions.map((item) => (
                  <tr key={item._id} className="border-t">
                    <td className="p-3">{item.studentName || item.studentId?.name || "-"}</td>
                    <td className="p-3">{item.studentId?.userId || item.studentUserId || "-"}</td>
                    <td className="p-3">{item.projectName || item.projectId?.title || "-"}</td>
                    <td className="p-3">{item.taskName || item.taskId?.title || "-"}</td>
                    <td className="p-3">{item.marks ?? "-"}</td>
                    <td className="p-3">{item.grade || "-"}</td>
                    <td className="p-3">{item.comments || "-"}</td>
                    <td className="p-3">{new Date(item.updatedAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
};

export default FeedbackPage;
