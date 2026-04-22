import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const colors = ["#7c3aed", "#0ea5e9", "#22c55e", "#f59e0b", "#ef4444"];

const DashboardPage = () => {
  const [summary, setSummary] = useState({ totalTasks: 0, completed: 0, pending: 0 });
  const [analytics, setAnalytics] = useState({ performance: [], taskCompletion: {}, projectProgress: {} });
  const [projectStatus, setProjectStatus] = useState({ completed: 0, ongoing: 0, pending: 0, delayed: 0 });
  const [latestAnnouncements, setLatestAnnouncements] = useState([]);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentAnalytics, setStudentAnalytics] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      const [summaryRes, announcementsRes] = await Promise.all([
        api.get("/users/dashboard-summary"),
        api.get("/announcements/latest", { params: { limit: 3 } }),
      ]);
      setSummary(summaryRes.data);
      setLatestAnnouncements(announcementsRes.data || []);
      if (user.role !== "Student") {
        const [performanceRes, projectStatusRes, studentsRes] = await Promise.all([
          api.get("/analytics/performance"),
          api.get("/analytics/project-status"),
          api.get("/analytics/students"),
        ]);
        setAnalytics(performanceRes.data);
        setProjectStatus(projectStatusRes.data);
        setStudents(studentsRes.data);
      } else if (user.id) {
        const studentRes = await api.get(`/analytics/student/${user.id}`);
        setStudentAnalytics(studentRes.data);
      }
    };
    load();
  }, [user.id, user.role]);

  useEffect(() => {
    if (user.role === "Student" || !selectedStudentId) return;
    const loadStudent = async () => {
      const { data } = await api.get(`/analytics/student/${selectedStudentId}`);
      setStudentAnalytics(data);
    };
    loadStudent();
  }, [selectedStudentId, user.role]);

  const filteredStudents = useMemo(() => {
    const key = search.trim().toLowerCase();
    if (!key) return students;
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(key) || (student.userId || "").toLowerCase().includes(key)
    );
  }, [search, students]);

  const completionData = Object.entries(analytics.taskCompletion || {}).map(([name, value]) => ({ name, value }));
  const projectProgressData = Object.entries(analytics.projectProgress || {}).map(([name, value]) => ({
    name,
    value,
  }));
  const performanceData = (analytics.performance || []).map((item) => ({
    name: item.studentName,
    score: item.performanceScore,
    marks: item.averageMarks,
  }));
  const projectStatusData = [
    { name: "Completed", value: projectStatus.completed },
    { name: "Ongoing", value: projectStatus.ongoing },
    { name: "Pending", value: projectStatus.pending },
    { name: "Delayed", value: projectStatus.delayed },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Welcome, {user.name}</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-violet-600 p-4 text-white"><p>Total Tasks</p><h3 className="text-3xl">{summary.totalTasks}</h3></div>
        <div className="rounded-xl bg-emerald-500 p-4 text-white"><p>Completed</p><h3 className="text-3xl">{summary.completed}</h3></div>
        <div className="rounded-xl bg-amber-500 p-4 text-white"><p>Pending</p><h3 className="text-3xl">{summary.pending}</h3></div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Latest Announcements</h3>
          <span className="text-xs text-slate-500">{latestAnnouncements.length} items</span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {latestAnnouncements.length === 0 ? (
            <p className="text-sm text-slate-500">No announcements available right now.</p>
          ) : (
            latestAnnouncements.map((item) => (
              <article key={item._id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                    {item.targetRole}
                  </span>
                </div>
                <p className="mt-2 line-clamp-3 text-sm text-slate-600">{item.message}</p>
                <p className="mt-3 text-xs text-slate-400">
                  {new Date(item.createdDate).toLocaleDateString()} by {item.createdBy?.name || item.createdByRole}
                </p>
              </article>
            ))
          )}
        </div>
      </section>

      {(user.role === "Supervisor" || user.role === "Admin") && (
        <section className="rounded-2xl border p-4">
          <h3 className="text-lg font-semibold">Search Student Analytics</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input
              className="rounded-lg border p-2"
              placeholder="Search by student name or student ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="rounded-lg border p-2"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
            >
              <option value="">Select student</option>
              {filteredStudents.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.name} ({student.userId || "No ID"})
                </option>
              ))}
            </select>
          </div>
        </section>
      )}

      {studentAnalytics?.student && (
        <section className="rounded-2xl border p-4">
          <h3 className="text-lg font-semibold">Student Details</h3>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-xl bg-slate-100 p-3"><p className="text-xs text-slate-500">Student Name</p><p className="font-semibold">{studentAnalytics.student.name}</p></div>
            <div className="rounded-xl bg-slate-100 p-3"><p className="text-xs text-slate-500">Student ID</p><p className="font-semibold">{studentAnalytics.student.userId || "-"}</p></div>
            <div className="rounded-xl bg-slate-100 p-3"><p className="text-xs text-slate-500">Assigned Projects</p><p className="font-semibold">{studentAnalytics.analytics.assignedProjects}</p></div>
            <div className="rounded-xl bg-slate-100 p-3"><p className="text-xs text-slate-500">Completed Tasks</p><p className="font-semibold">{studentAnalytics.analytics.completedTasks}</p></div>
            <div className="rounded-xl bg-slate-100 p-3"><p className="text-xs text-slate-500">Pending Tasks</p><p className="font-semibold">{studentAnalytics.analytics.pendingTasks}</p></div>
            <div className="rounded-xl bg-violet-600 p-3 text-white"><p className="text-xs text-violet-100">Performance Score</p><p className="font-semibold">{studentAnalytics.analytics.performanceScore}</p></div>
          </div>
        </section>
      )}

      {user.role !== "Student" && (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border p-4">
            <h3 className="mb-3 font-semibold">Student Performance Comparison</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={performanceData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="score" fill="#7c3aed" name="Performance Score" />
                <Bar dataKey="marks" fill="#0ea5e9" name="Average Marks" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border p-4">
            <h3 className="mb-3 font-semibold">Project Status Distribution</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={projectStatusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                  {projectStatusData.map((_, index) => (
                    <Cell key={`status-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border p-4">
            <h3 className="mb-3 font-semibold">Task Completion Chart</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={completionData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border p-4">
            <h3 className="mb-3 font-semibold">Project Progress Chart</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={projectProgressData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line dataKey="value" stroke="#f59e0b" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
