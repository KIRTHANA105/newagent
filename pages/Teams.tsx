import React, { useState } from "react";
import { useStore } from "../context/Store";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { PlusCircle, Save, Users, Eye } from "lucide-react";

export const Teams = () => {
  const { teams, users, teamMembers, currentUser, createTeam } = useStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamSkills, setNewTeamSkills] = useState("");
  const [showDebug, setShowDebug] = useState(false);

  // Filter teams based on user role
  const filteredTeams = React.useMemo(() => {
    // Show all teams to all logged-in users. The UI previously hid teams
    // from non-admins which prevented viewing team members/lead details
    // when logged in as a different user. This change makes team pages
    // visible to everyone (you can reintroduce stricter filtering later).
    if (!currentUser) return [];
    return teams;
  }, [currentUser, teams, teamMembers]);

  const getTeamMembers = (teamId: number) => {
    return teamMembers
      .filter((tm) => tm.team_id === teamId)
      .map((tm) => {
        const u = users.find((user) => user.id === tm.member_id);
        return {
          id: tm.member_id,
          name: u?.name || `Unknown (${tm.member_id})`,
          avatar: u?.avatar || "",
          role: u?.role || "member",
          workload: tm.workload,
        };
      });
  };

  const getMemberData = (teamId: number) => {
    return teamMembers
      .filter((tm) => tm.team_id === teamId)
      .map((tm) => {
        const u = users.find((user) => user.id === tm.member_id);
        return {
          name: u?.name?.split(" ")[0] || "Unknown", // First name with null safety
          workload: tm.workload,
        };
      });
  };

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTeamName && newTeamSkills) {
      const skillsArray = newTeamSkills.split(",").map((s) => s.trim());
      createTeam(newTeamName, skillsArray);
      setShowCreate(false);
      setNewTeamName("");
      setNewTeamSkills("");
    }
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {currentUser?.role === "admin"
              ? "Teams & Workloads"
              : currentUser?.role === "team_lead"
              ? "My Team"
              : "My Team"}
          </h2>
          <p className="text-gray-500">
            {currentUser?.role === "admin"
              ? "Monitor agent distribution and member capacity."
              : "View your team members and their current workload."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {currentUser?.role === "admin" && (
            <button
              onClick={() => setShowDebug((s) => !s)}
              className="flex items-center gap-2 bg-gray-100 text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              title="Toggle debug data"
            >
              <Eye size={16} /> Debug
            </button>
          )}

          {currentUser?.role === "admin" && (
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <PlusCircle size={18} /> New Team
            </button>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-lg mb-8 animate-in slide-in-from-top-4">
          <h3 className="font-bold text-lg mb-4 text-gray-800">
            Create New Team
          </h3>
          <form
            onSubmit={handleCreateTeam}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <input
              type="text"
              placeholder="Team Name (e.g. Mobile, QA)"
              className="px-4 py-2 border rounded-lg"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Skills (comma separated, e.g. Swift, Kotlin)"
              className="px-4 py-2 border rounded-lg"
              value={newTeamSkills}
              onChange={(e) => setNewTeamSkills(e.target.value)}
              required
            />
            <button
              type="submit"
              className="bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2"
            >
              <Save size={18} /> Save Team
            </button>
          </form>
        </div>
      )}

      {filteredTeams.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="text-gray-400" size={32} />
          </div>
          <p className="text-gray-500 font-medium">
            {currentUser?.role === "admin"
              ? "No teams created yet."
              : "You are not assigned to any team yet."}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            {currentUser?.role === "admin"
              ? "Create a new team to get started."
              : "Please contact your administrator."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredTeams.map((team) => {
            const lead = users.find((u) => u.id === team.lead_id);
            const data = getMemberData(team.id);

            return (
              <div
                key={team.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {team.name}
                    </h3>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {team.skills.map((s) => (
                        <span
                          key={s}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">
                      Team Lead
                    </span>
                    <div className="flex items-center gap-2 mt-1 justify-end">
                      {lead ? (
                        <>
                          <span className="text-sm font-medium">
                            {lead.name}
                          </span>
                          <img
                            src={lead.avatar}
                            className="w-6 h-6 rounded-full"
                            alt=""
                          />
                        </>
                      ) : (
                        <span className="text-sm text-gray-400 italic">
                          {team.lead_id !== 0
                            ? `Unassigned (id: ${team.lead_id})`
                            : "Unassigned"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Team Members List */}
                <div className="mt-6 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Users size={16} className="text-gray-500" />
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Team Members ({getTeamMembers(team.id).length})
                    </h4>
                  </div>

                  {getTeamMembers(team.id).length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {getTeamMembers(team.id).map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                            />
                            <div>
                              <p className="font-medium text-gray-900">
                                {member.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    member.role === "admin"
                                      ? "bg-purple-100 text-purple-700"
                                      : member.role === "team_lead"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-green-100 text-green-700"
                                  }`}
                                >
                                  {member.role === "team_lead"
                                    ? "Team Lead"
                                    : member.role.charAt(0).toUpperCase() +
                                      member.role.slice(1)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">
                              Workload
                            </p>
                            <p
                              className={`text-lg font-bold ${
                                member.workload > 3
                                  ? "text-red-600"
                                  : member.workload > 1
                                  ? "text-yellow-600"
                                  : "text-green-600"
                              }`}
                            >
                              {member.workload}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="text-sm text-gray-500 italic">
                        No members assigned to this team
                      </p>
                    </div>
                  )}
                </div>

                {data.length > 0 ? (
                  <div>
                    <div
                      className="w-full mt-4"
                      style={{ height: "192px", minHeight: "192px" }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                          <XAxis
                            dataKey="name"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            cursor={{ fill: "#F3F4F6" }}
                            contentStyle={{
                              borderRadius: "8px",
                              border: "none",
                              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                            }}
                          />
                          <Bar dataKey="workload" radius={[4, 4, 0, 0]}>
                            {data.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  entry.workload > 3 ? "#EF4444" : "#6366F1"
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-center text-gray-400 mt-2">
                      Active Tasks per Member
                    </p>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-lg">
                    No members assigned
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Debug panel (admin only) */}
      {showDebug && currentUser?.role === "admin" && (
        <div className="mt-8 bg-gray-900 text-white p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Raw Data (debug)</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h5 className="text-sm font-medium mb-1">Teams</h5>
              <pre className="text-xs overflow-auto max-h-48 bg-gray-800 p-2 rounded">
                {JSON.stringify(teams, null, 2)}
              </pre>
            </div>
            <div>
              <h5 className="text-sm font-medium mb-1">Users</h5>
              <pre className="text-xs overflow-auto max-h-48 bg-gray-800 p-2 rounded">
                {JSON.stringify(users, null, 2)}
              </pre>
            </div>
            <div>
              <h5 className="text-sm font-medium mb-1">Team Members</h5>
              <pre className="text-xs overflow-auto max-h-48 bg-gray-800 p-2 rounded">
                {JSON.stringify(teamMembers, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
