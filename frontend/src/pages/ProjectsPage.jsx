import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const initialProjectForm = {
  title: "",
  description: "",
  teamMembers: [],
  status: "Ongoing",
};

const initialTaskForm = {
  title: "",
  description: "",
  requiredSkills: "",
  assignedTo: "",
  deadline: "",
  priority: "Medium",
};

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [students, setStudents] = useState([]);
  const [projectForm, setProjectForm] = useState(initialProjectForm);
  const [editingProjectId, setEditingProjectId] = useState("");
  const [editingTaskId, setEditingTaskId] = useState("");
  const [taskForm, setTaskForm] = useState(initialTaskForm);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const canManage = user.role === "Supervisor" || user.role === "Admin";

  const load = useCallback(async () => {
    setError("");
    try {
      const requests = [api.get("/projects"), api.get("/tasks")];
      if (canManage) requests.push(api.get("/users/students"));
      const [projectsRes, tasksRes, studentsRes] = await Promise.all(requests);
      setProjects(projectsRes.data);
      setTasks(tasksRes.data);
      setStudents(studentsRes?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load project data");
    }
  }, [canManage]);
  useEffect(() => { load(); }, [load]);

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post("/projects", projectForm);
      setProjectForm(initialProjectForm);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create project");
    }
  };

  const openProjectEdit = (project) => {
    setEditingProjectId(project._id);
    setProjectForm({
      title: project.title || "",
      description: project.description || "",
      teamMembers: (project.teamMembers || []).map((member) => member._id || member),
      status: project.status === "Active" ? "Ongoing" : project.status || "Ongoing",
    });
  };

  const updateProject = async (e) => {
    e.preventDefault();
    if (!editingProjectId) return;
    try {
      await api.put(`/projects/${editingProjectId}`, projectForm);
      setEditingProjectId("");
      setProjectForm(initialProjectForm);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update project");
    }
  };

  const deleteProject = async (id) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await api.delete(`/projects/${id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete project");
    }
  };

  const openTaskEdit = (task) => {
    setEditingTaskId(task._id);
    setTaskForm({
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
    if (!editingTaskId) return;
    try {
      await api.put(`/tasks/${editingTaskId}`, {
        title: taskForm.title,
        description: taskForm.description,
        requiredSkills: taskForm.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean),
        assignedTo: taskForm.assignedTo || null,
        deadline: taskForm.deadline,
        priority: taskForm.priority,
      });
      setEditingTaskId("");
      setTaskForm(initialTaskForm);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update task");
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete task");
    }
  };

  const tasksByProject = useMemo(() => {
    const map = new Map();
    tasks.forEach((task) => {
      const key = task.projectId?._id || task.projectId;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(task);
    });
    return map;
  }, [tasks]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Projects</h2>
      {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
      {canManage && (
        <form onSubmit={create} className="grid gap-2 rounded-xl border p-4 md:grid-cols-2">
          <input
            className="rounded border p-2"
            placeholder="Project title"
            value={projectForm.title}
            onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
            required
          />
          <select
            className="rounded border p-2"
            value={projectForm.status}
            onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}
          >
            <option value="Ongoing">Ongoing</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
          </select>
          <input
            className="rounded border p-2 md:col-span-2"
            placeholder="Description"
            value={projectForm.description}
            onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
            required
          />
          <select
            className="rounded border p-2 md:col-span-2"
            multiple
            value={projectForm.teamMembers}
            onChange={(e) =>
              setProjectForm({
                ...projectForm,
                teamMembers: [...e.target.selectedOptions].map((option) => option.value),
              })
            }
          >
            {students.map((student) => (
              <option key={student._id} value={student._id}>
                {student.name} ({student.userId || student.email})
              </option>
            ))}
          </select>
          <button className="rounded bg-violet-600 px-3 py-2 text-white md:col-span-2">Create Project</button>
        </form>
      )}

      {editingProjectId && canManage && (
        <form onSubmit={updateProject} className="grid gap-2 rounded-xl border border-violet-200 bg-violet-50 p-4 md:grid-cols-2">
          <h3 className="font-semibold md:col-span-2">Edit Project</h3>
          <input className="rounded border p-2" value={projectForm.title} onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })} required />
          <select className="rounded border p-2" value={projectForm.status} onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}>
            <option value="Ongoing">Ongoing</option><option value="Completed">Completed</option><option value="On Hold">On Hold</option>
          </select>
          <input className="rounded border p-2 md:col-span-2" value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} required />
          <select
            className="rounded border p-2 md:col-span-2"
            multiple
            value={projectForm.teamMembers}
            onChange={(e) =>
              setProjectForm({
                ...projectForm,
                teamMembers: [...e.target.selectedOptions].map((option) => option.value),
              })
            }
          >
            {students.map((student) => <option key={student._id} value={student._id}>{student.name} ({student.userId || student.email})</option>)}
          </select>
          <div className="flex gap-2 md:col-span-2">
            <button className="rounded bg-violet-600 px-3 py-2 text-white">Save Changes</button>
            <button type="button" className="rounded border px-3 py-2" onClick={() => { setEditingProjectId(""); setProjectForm(initialProjectForm); }}>Cancel</button>
          </div>
        </form>
      )}

      {editingTaskId && canManage && (
        <form onSubmit={updateTask} className="grid gap-2 rounded-xl border border-sky-200 bg-sky-50 p-4 md:grid-cols-2">
          <h3 className="font-semibold md:col-span-2">Edit Task</h3>
          <input className="rounded border p-2" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required />
          <select className="rounded border p-2" value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
            <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
          </select>
          <input className="rounded border p-2 md:col-span-2" value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} required />
          <input className="rounded border p-2" placeholder="Required skills (comma separated)" value={taskForm.requiredSkills} onChange={(e) => setTaskForm({ ...taskForm, requiredSkills: e.target.value })} />
          <input className="rounded border p-2" type="date" value={taskForm.deadline} onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })} required />
          <select className="rounded border p-2 md:col-span-2" value={taskForm.assignedTo} onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}>
            <option value="">Unassigned</option>
            {students.map((student) => <option key={student._id} value={student._id}>{student.name} ({student.userId || student.email})</option>)}
          </select>
          <div className="flex gap-2 md:col-span-2">
            <button className="rounded bg-sky-600 px-3 py-2 text-white">Update Task</button>
            <button type="button" className="rounded border px-3 py-2" onClick={() => { setEditingTaskId(""); setTaskForm(initialTaskForm); }}>Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {projects.map((project) => (
          <div key={project._id} className="rounded-xl border p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold">{project.title}</h3>
                <p className="text-sm text-slate-600">{project.description}</p>
                <p className="mt-1 text-xs text-slate-500">Status: {project.status === "Active" ? "Ongoing" : project.status}</p>
              </div>
              {canManage && (
                <div className="flex gap-2">
                  <button className="rounded border px-3 py-1 text-sm" onClick={() => openProjectEdit(project)}>Edit Project</button>
                  <button className="rounded bg-rose-500 px-3 py-1 text-sm text-white" onClick={() => deleteProject(project._id)}>Delete Project</button>
                </div>
              )}
            </div>

            <div className="mt-3 rounded-lg bg-slate-50 p-3">
              <h4 className="text-sm font-semibold">Task Section</h4>
              {(tasksByProject.get(project._id) || []).length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No tasks linked to this project.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {(tasksByProject.get(project._id) || []).map((task) => (
                    <div key={task._id} className="rounded-md border bg-white p-3">
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-slate-600">{task.description}</p>
                      <p className="text-xs text-slate-500">
                        Assigned: {task.assignedTo?.name || "Unassigned"} | Priority: {task.priority || "Medium"} | Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString() : "-"}
                      </p>
                      {canManage && (
                        <div className="mt-2 flex gap-2">
                          <button className="rounded border px-2 py-1 text-xs" onClick={() => openTaskEdit(task)}>Edit Task</button>
                          <button className="rounded bg-rose-500 px-2 py-1 text-xs text-white" onClick={() => deleteTask(task._id)}>Delete Task</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectsPage;
