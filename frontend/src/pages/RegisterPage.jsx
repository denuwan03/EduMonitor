import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RegisterPage = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "Student" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-cyan-700 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h2 className="text-2xl font-semibold">Create account</h2>
        <input className="mt-4 w-full rounded-lg border p-3" placeholder="Full name" required onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="mt-3 w-full rounded-lg border p-3" placeholder="Email" type="email" required onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="mt-3 w-full rounded-lg border p-3" placeholder="Password" type="password" required onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <select className="mt-3 w-full rounded-lg border p-3" onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option>Student</option><option>Supervisor</option><option>Admin</option>
        </select>
        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
        <button className="mt-4 w-full rounded-lg bg-cyan-600 p-3 text-white" disabled={loading}>{loading ? "Creating..." : "Register"}</button>
        <p className="mt-4 text-sm">Already have account? <Link className="text-cyan-700" to="/login">Login</Link></p>
      </form>
    </div>
  );
};

export default RegisterPage;
