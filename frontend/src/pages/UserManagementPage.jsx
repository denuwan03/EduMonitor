import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const defaultForm = {
  name: "",
  email: "",
  role: "Student",
  password: "",
  status: "Active",
};

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [form, setForm] = useState(defaultForm);
  const [creating, setCreating] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [updating, setUpdating] = useState(false);

  const params = useMemo(() => {
    const query = {};
    if (search.trim()) query.search = search.trim();
    if (roleFilter) query.role = roleFilter;
    return query;
  }, [search, roleFilter]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/users", { params });
      setUsers(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      await api.post("/users/create", form);
      setForm(defaultForm);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError("");
    try {
      await api.put(`/users/${editingUser._id}`, {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        status: editingUser.status,
      });
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async (id) => {
    const confirmed = window.confirm("Delete this user from the system?");
    if (!confirmed) return;
    setError("");
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete user");
    }
  };

  const handleResetPassword = async (id) => {
    const newPassword = window.prompt("Enter new temporary password");
    if (!newPassword) return;
    setError("");
    try {
      await api.post("/users/reset-password", { userId: id, password: newPassword });
      window.alert("Password reset successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">User Management</h2>
        <p className="text-sm text-slate-500">Admin can create, assign roles, reset passwords, and manage users.</p>
      </div>

      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-600">{error}</p>}

      <section className="rounded-2xl border border-slate-200 p-5">
        <h3 className="text-lg font-semibold text-slate-800">Create User</h3>
        <form onSubmit={handleCreateUser} className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            className="rounded-lg border p-3"
            placeholder="Full name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="rounded-lg border p-3"
            placeholder="Email address"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <select
            className="rounded-lg border p-3"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="Student">Student</option>
            <option value="Supervisor">Supervisor</option>
          </select>
          <select
            className="rounded-lg border p-3"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <input
            className="rounded-lg border p-3 md:col-span-2"
            placeholder="Temporary password"
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button disabled={creating} className="rounded-lg bg-violet-600 p-3 font-medium text-white md:col-span-2">
            {creating ? "Saving..." : "Save User"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-semibold text-slate-800">All Users</h3>
          <div className="flex flex-col gap-2 md:flex-row">
            <input
              className="rounded-lg border p-2"
              placeholder="Search by name, email, user ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="rounded-lg border p-2"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Student">Student</option>
            </select>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3">User ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="border-b">
                    <td className="p-3 font-medium">{user.userId || "-"}</td>
                    <td className="p-3">{user.name}</td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3">{user.role}</td>
                    <td className="p-3">{user.status}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded bg-slate-200 px-2 py-1 text-xs"
                          onClick={() => setEditingUser({ ...user })}
                        >
                          Edit
                        </button>
                        <button
                          className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-700"
                          onClick={() => handleResetPassword(user._id)}
                        >
                          Reset Password
                        </button>
                        <button
                          className="rounded bg-rose-100 px-2 py-1 text-xs text-rose-700"
                          onClick={() => handleDeleteUser(user._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form onSubmit={handleUpdateUser} className="w-full max-w-lg rounded-2xl bg-white p-6">
            <h4 className="text-lg font-semibold text-slate-900">Edit User</h4>
            <div className="mt-4 space-y-3">
              <input
                className="w-full rounded-lg border p-3"
                value={editingUser.name}
                onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
              />
              <input
                className="w-full rounded-lg border p-3"
                value={editingUser.email}
                onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
              />
              <select
                className="w-full rounded-lg border p-3"
                value={editingUser.role}
                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
              >
                <option value="Admin">Admin</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Student">Student</option>
              </select>
              <select
                className="w-full rounded-lg border p-3"
                value={editingUser.status}
                onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-4 py-2"
                onClick={() => setEditingUser(null)}
              >
                Cancel
              </button>
              <button disabled={updating} className="rounded-lg bg-violet-600 px-4 py-2 text-white">
                {updating ? "Updating..." : "Update User"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
