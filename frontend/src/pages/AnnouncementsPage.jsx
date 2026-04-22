import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const initialForm = {
  title: "",
  message: "",
  targetRole: "All",
  createdDate: new Date().toISOString().slice(0, 10),
};

const targetRoleStyles = {
  All: "bg-violet-100 text-violet-700",
  Student: "bg-emerald-100 text-emerald-700",
  Supervisor: "bg-sky-100 text-sky-700",
};

const AnnouncementsPage = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const canWrite = user?.role === "Admin" || user?.role === "Supervisor";
  const canDelete = user?.role === "Admin";

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/announcements");
      setAnnouncements(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const latest = useMemo(() => announcements.slice(0, 3), [announcements]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId("");
    setShowCreate(false);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    if (!canWrite) return;
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        await api.put(`/announcements/${editingId}`, form);
      } else {
        await api.post("/announcements", form);
      }
      resetForm();
      await loadAnnouncements();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save announcement");
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (announcement) => {
    setEditingId(announcement._id);
    setForm({
      title: announcement.title,
      message: announcement.message,
      targetRole: announcement.targetRole,
      createdDate: new Date(announcement.createdDate).toISOString().slice(0, 10),
    });
  };

  const removeAnnouncement = async (id) => {
    if (!canDelete) return;
    if (!window.confirm("Delete this announcement?")) return;
    setError("");
    try {
      await api.delete(`/announcements/${id}`);
      await loadAnnouncements();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete announcement");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Announcements</h2>
          <p className="text-sm text-slate-500">Stay updated with the latest notices from Admin and Supervisors.</p>
        </div>
        {canWrite && (
          <button
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700"
            onClick={() => {
              setShowCreate(true);
              setEditingId("");
              setForm(initialForm);
            }}
          >
            Create Announcement
          </button>
        )}
      </div>

      {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</div>}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Latest Announcements</h3>
          <span className="text-xs text-slate-500">{latest.length} recent</span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {latest.length === 0 ? (
            <p className="text-sm text-slate-500">No announcements yet.</p>
          ) : (
            latest.map((item) => (
              <article key={item._id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${targetRoleStyles[item.targetRole]}`}>
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

      {(showCreate || editingId) && canWrite && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold">{editingId ? "Edit Announcement" : "Create Announcement"}</h3>
          <form className="mt-3 grid gap-3 md:grid-cols-2" onSubmit={submitForm}>
            <input
              className="rounded-lg border border-slate-300 p-3 md:col-span-2"
              placeholder="Announcement title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <textarea
              className="rounded-lg border border-slate-300 p-3 md:col-span-2"
              placeholder="Announcement message"
              rows={4}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
            />
            <select
              className="rounded-lg border border-slate-300 p-3"
              value={form.targetRole}
              onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
            >
              <option value="All">All</option>
              <option value="Student">Student</option>
              <option value="Supervisor">Supervisor</option>
            </select>
            <input
              className="rounded-lg border border-slate-300 p-3"
              type="date"
              value={form.createdDate}
              onChange={(e) => setForm({ ...form, createdDate: e.target.value })}
              required
            />
            <div className="flex gap-2 md:col-span-2">
              <button disabled={saving} className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white">
                {saving ? "Saving..." : editingId ? "Update Announcement" : "Post Announcement"}
              </button>
              <button type="button" className="rounded-lg border border-slate-300 px-4 py-2 text-sm" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold">Announcement List</h3>
        <div className="mt-4 space-y-3">
          {loading ? (
            <p className="text-sm text-slate-500">Loading announcements...</p>
          ) : announcements.length === 0 ? (
            <p className="text-sm text-slate-500">No announcements available.</p>
          ) : (
            announcements.map((item) => (
              <article key={item._id} className="rounded-xl border border-slate-200 p-4 transition hover:shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4 className="text-base font-semibold text-slate-900">{item.title}</h4>
                    <p className="mt-1 text-xs text-slate-500">
                      Posted by {item.createdBy?.name || item.createdByRole} ({item.createdByRole}) on{" "}
                      {new Date(item.createdDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${targetRoleStyles[item.targetRole]}`}>
                    {item.targetRole}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{item.message}</p>
                {canWrite && (
                  <div className="mt-4 flex gap-2">
                    <button
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium"
                      onClick={() => openEditModal(item)}
                    >
                      Edit
                    </button>
                    {canDelete && (
                      <button
                        className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-medium text-white"
                        onClick={() => removeAnnouncement(item._id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default AnnouncementsPage;
