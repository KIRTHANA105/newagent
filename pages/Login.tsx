import React, { useState } from "react";
import { useStore } from "../context/Store";
import { Shield, Briefcase, Users, UserPlus, LogIn } from "lucide-react";
import { Role } from "../types";

export const Login = () => {
  const { login, signup, teams, users } = useStore();
  const [isLogin, setIsLogin] = useState(true);

  // Login State
  const [loginEmail, setLoginEmail] = useState("");
  const [error, setError] = useState("");

  // Signup State
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<Role>("member");
  const [selectedTeam, setSelectedTeam] = useState<number | "">("");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const success = await login(loginEmail);
    if (!success) setError("User not found. Try signing up?");
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!newName || !newEmail) {
      setError("Name and Email are required.");
      return;
    }
    // If member or lead, team is preferred
    if (newRole !== "admin" && selectedTeam === "") {
      setError("Please select a team to join.");
      return;
    }
    try {
      await signup(
        newName,
        newEmail,
        newRole,
        selectedTeam === "" ? undefined : Number(selectedTeam)
      );
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    }
  };

  // Helper to pre-fill login for demo purposes
  const demoLogin = async (email: string) => {
    setError("");
    const success = await login(email);
    if (!success) setError("User not found. Try signing up?");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
          TaskMaster<span className="text-indigo-600">AI</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-lg mx-auto">
          Autonomous Team Management System
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-4xl w-full grid grid-cols-1 md:grid-cols-2">
        {/* Left Side: Forms */}
        <div className="p-8">
          <div className="flex gap-4 mb-8 border-b border-gray-100">
            <button
              onClick={() => {
                setIsLogin(true);
                setError("");
              }}
              className={`pb-2 text-sm font-bold transition-colors ${
                isLogin
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-400"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError("");
              }}
              className={`pb-2 text-sm font-bold transition-colors ${
                !isLogin
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-400"
              }`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="mb-4 text-xs text-red-500 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          {isLogin ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="user@corp.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <LogIn size={18} /> Login
              </button>

              <div className="pt-6 mt-6 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-3 text-center">
                  Or click to demo login:
                </p>
                <div className="flex gap-2 justify-center">
                  {users.slice(0, 3).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => demoLogin(u.email)}
                      className="text-xs bg-gray-50 hover:bg-gray-100 px-3 py-1 rounded border border-gray-200"
                    >
                      {u.name}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="John Doe"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="john@corp.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Role
                  </label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as Role)}
                  >
                    <option value="member">Member</option>
                    <option value="team_lead">Team Lead</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {newRole !== "admin" && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Team
                    </label>
                    <select
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={selectedTeam}
                      onChange={(e) => setSelectedTeam(Number(e.target.value))}
                    >
                      <option value="">Select...</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <UserPlus size={18} /> Create Account
              </button>
            </form>
          )}
        </div>

        {/* Right Side: Info */}
        <div className="bg-indigo-900 p-8 text-white flex flex-col justify-center">
          <h3 className="text-2xl font-bold mb-6">AI-Powered Workflow</h3>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="bg-indigo-800 p-3 rounded-lg h-fit">
                <Shield size={20} />
              </div>
              <div>
                <h4 className="font-bold">Admin</h4>
                <p className="text-indigo-200 text-sm">
                  Creates teams, views logs, and manages the entire system.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-indigo-800 p-3 rounded-lg h-fit">
                <Briefcase size={20} />
              </div>
              <div>
                <h4 className="font-bold">Team Lead</h4>
                <p className="text-indigo-200 text-sm">
                  Manages specific teams like Frontend, Backend, or Cloud.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-indigo-800 p-3 rounded-lg h-fit">
                <Users size={20} />
              </div>
              <div>
                <h4 className="font-bold">Member</h4>
                <p className="text-indigo-200 text-sm">
                  Receives tasks automatically assigned based on workload.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
