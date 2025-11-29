import React from "react";
import { useStore } from "../context/Store";
import {
  LogOut,
  LayoutDashboard,
  PlusCircle,
  Users,
  Activity,
  ShieldCheck,
} from "lucide-react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";

const SidebarItem = ({
  to,
  icon: Icon,
  label,
  active,
}: {
  to: string;
  icon: any;
  label: string;
  active: boolean;
}) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      active
        ? "bg-indigo-600 text-white shadow-lg"
        : "text-gray-500 hover:bg-white hover:text-indigo-600"
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

export const Layout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentUser, logout } = useStore();
  const location = useLocation();

  if (!currentUser) return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-100 border-r border-gray-200 flex flex-col fixed h-full z-10">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Activity className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
              TaskMaster<span className="text-indigo-600">AI</span>
            </h1>
          </div>

          <nav className="space-y-2">
            <SidebarItem
              to="/"
              icon={LayoutDashboard}
              label="Dashboard"
              active={location.pathname === "/"}
            />

            {(currentUser.role === "admin" ||
              currentUser.role === "team_lead") && (
              <SidebarItem
                to="/create"
                icon={PlusCircle}
                label="Create Task"
                active={location.pathname === "/create"}
              />
            )}

            <SidebarItem
              to="/teams"
              icon={Users}
              label="Teams"
              active={location.pathname === "/teams"}
            />

            {currentUser.role === "admin" && (
              <SidebarItem
                to="/logs"
                icon={ShieldCheck}
                label="Agent Logs"
                active={location.pathname === "/logs"}
              />
            )}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={currentUser.avatar}
              alt="User"
              className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
            />
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {currentUser.name}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {currentUser.role.replace("_", " ")}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
};
