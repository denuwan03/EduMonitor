import { Link, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, FolderKanban, ListChecks, Upload, MessageSquare, User, Users, Megaphone } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const baseItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/projects", icon: FolderKanban, label: "Projects" },
  { to: "/tasks", icon: ListChecks, label: "Tasks" },
  { to: "/submissions", icon: Upload, label: "Submissions" },
  { to: "/feedback", icon: MessageSquare, label: "Feedback" },
  { to: "/announcements", icon: Megaphone, label: "Announcements" },
  { to: "/profile", icon: User, label: "Profile" },
];

const DashboardLayout = () => {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const items = user?.role === "Admin"
    ? [...baseItems, { to: "/user-management", icon: Users, label: "User Management" }]
    : baseItems;

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex max-w-7xl gap-6 p-4">
        <aside className="w-64 rounded-2xl bg-slate-900 p-5 text-slate-100">
          <h1 className="text-xl font-bold">EduMonitor</h1>
          <p className="mt-1 text-xs text-slate-300">{user?.role} Portal</p>
          <nav className="mt-6 space-y-2">
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${
                  pathname === item.to ? "bg-violet-600" : "hover:bg-slate-800"
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            ))}
          </nav>
          <button onClick={logout} className="mt-6 w-full rounded-lg bg-rose-500 px-3 py-2 text-sm">
            Logout
          </button>
        </aside>
        <main className="flex-1 rounded-2xl bg-white p-6 shadow-sm">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
