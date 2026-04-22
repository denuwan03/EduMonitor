import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const initialTaskForm = {
  projectId: "",
  title: "",
  description: "",
  requiredSkills: "",
  assignedTo: "",
  deadline: "",
  priority: "Medium",
};

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(initialTaskForm);
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");
  const { user } = useAuth();
  const canManage = user.role === "Supervisor" || user.role === "Admin";

  const load = useCallback(async () => {
    setError("");
    try {
      const requests = [api.get("/tasks"), api.get("/projects")];
      if (canManage) requests.push(api.get("/users/students"));
      const [taskRes, projectRes, studentRes] = await Promise.all(requests);
      setTasks(taskRes.data);
      setProjects(projectRes.data);
      setStudents(studentRes?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load tasks");
    }
  }, [canManage]);
  useEffect(() => { load(); }, [load]);

  const createTask = async (e) => {
    e.preventDefault();
    try {
      await api.post("/tasks", {
        ...form,
        assignedTo: form.assignedTo || undefined,
        requiredSkills: form.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean),
      });
      setForm(initialTaskForm);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create task");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/tasks/${id}`, { status });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update task status");
    }
  };

  const openEdit = (task) => {
    setEditingId(task._id);
    setForm({
      projectId: task.projectId?._id || task.projectId || "",
      title: task.title || "",
      description: task.description || "",
      requiredSkills: (task.requiredSkills || []).join(", "),
      assignedTo: task.assignedTo?._id || "",
      deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 10) : "",
      priority: task.priority || "Medium",
    });
  };

  const updateTask = async (e) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      await api.put(`/tasks/${editingId}`, {
        ...form,
        assignedTo: form.assignedTo || null,
        requiredSkills: form.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean),
      });
      setEditingId("");
      setForm(initialTaskForm);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update task");
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.delete(`/tasks/${id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete task");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Tasks</h2>
      {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

      {canManage && (
        <form onSubmit={createTask} className="mt-4 grid gap-2 rounded-xl border p-4 md:grid-cols-2">
          <select className="rounded border p-2" required value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
            <option value="">Select project</option>
            {projects.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}
          </select>
          <input className="rounded border p-2" placeholder="Task title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className="rounded border p-2" placeholder="Description" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input className="rounded border p-2" placeholder="Required skills (comma separated)" value={form.requiredSkills} onChange={(e) => setForm({ ...form, requiredSkills: e.target.value })} />
          <select className="rounded border p-2" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
            <option value="">Auto/Unassigned</option>
            {students.map((student) => <option key={student._id} value={student._id}>{student.name} ({student.userId || student.email})</option>)}
          </select>
          <input className="rounded border p-2" type="date" required value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          <select className="rounded border p-2" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
          </select>
          <button className="rounded bg-violet-600 px-3 py-2 text-white">Create + Smart Assign</button>
        </form>
      )}

      {editingId && canManage && (
        <form onSubmit={updateTask} className="grid gap-2 rounded-xl border border-violet-200 bg-violet-50 p-4 md:grid-cols-2">
          <h3 className="font-semibold md:col-span-2">Edit Task</h3>
          <select className="rounded border p-2" required value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
            <option value="">Select project</option>
            {projects.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}
          </select>
          <input className="rounded border p-2" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className="rounded border p-2 md:col-span-2" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input className="rounded border p-2" value={form.requiredSkills} onChange={(e) => setForm({ ...form, requiredSkills: e.target.value })} />
          <select className="rounded border p-2" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
            <option value="">Unassigned</option>
            {students.map((student) => <option key={student._id} value={student._id}>{student.name} ({student.userId || student.email})</option>)}
          </select>
          <input className="rounded border p-2" type="date" required value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          <select className="rounded border p-2" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
          </select>
          <div className="flex gap-2 md:col-span-2">
            <button className="rounded bg-violet-600 px-3 py-2 text-white">Update Task</button>
            <button type="button" className="rounded border px-3 py-2" onClick={() => { setEditingId(""); setForm(initialTaskForm); }}>Cancel</button>
          </div>
        </form>
      )}

      <div className="mt-4 space-y-3">
        {tasks.map((task) => (
          <div key={task._id} className="rounded-xl border p-4">
            <h3 className="font-semibold">{task.title}</h3>
            <p className="text-sm text-slate-600">{task.description}</p>
            <p className="mt-1 text-sm">
              Project: {task.projectId?.title || "-"} | Assigned: {task.assignedTo?.name || "Unassigned"} | Status: {task.status}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString() : "-"} | Priority: {task.priority || "Medium"}
            </p>
            {task.smartAssignment && (
              <p className="mt-1 text-xs text-violet-700">
                Match Score: {task.smartAssignment.score} (skill {task.smartAssignment.details.skillMatch}, availability {task.smartAssignment.details.availability}, workload {task.smartAssignment.details.workload}) | Skill Gap: {(task.smartAssignment.skillGap || []).join(", ") || "None"}
              </p>
            )}
            {user.role === "Student" && (
              <select className="mt-2 rounded border p-2 text-sm" value={task.status} onChange={(e) => updateStatus(task._id, e.target.value)}>
                <option>Pending</option><option>In Progress</option><option>Submitted</option><option>Completed</option>
              </select>
            )}
            {canManage && (
              <div className="mt-2 flex gap-2">
                <button className="rounded border px-3 py-1 text-xs" onClick={() => openEdit(task)}>Edit Task</button>
                <button className="rounded bg-rose-500 px-3 py-1 text-xs text-white" onClick={() => deleteTask(task._id)}>Delete Task</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TasksPage;
