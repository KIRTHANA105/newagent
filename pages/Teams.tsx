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
import { PlusCircle, Save } from "lucide-react";

export const Teams = () => {
  const { teams, users, teamMembers, currentUser, createTeam } = useStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamSkills, setNewTeamSkills] = useState("");

  const getMemberData = (teamId: number) => {
    return teamMembers
      .filter((tm) => tm.team_id === teamId)
      .map((tm) => {
        const u = users.find((user) => user.id === tm.member_id);
        return {
          name: u?.name.split(" ")[0], // First name
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
            Teams & Workloads
          </h2>
          <p className="text-gray-500">
            Monitor agent distribution and member capacity.
          </p>
        </div>
        {currentUser?.role === "admin" && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <PlusCircle size={18} /> New Team
          </button>
        )}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {teams.map((team) => {
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
                        <span className="text-sm font-medium">{lead.name}</span>
                        <img
                          src={lead.avatar}
                          className="w-6 h-6 rounded-full"
                          alt=""
                        />
                      </>
                    ) : (
                      <span className="text-sm text-gray-400 italic">
                        Unassigned
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {data.length > 0 ? (
                <div className="w-full mt-4" style={{ height: '192px', minHeight: '192px' }}>
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
                            fill={entry.workload > 3 ? "#EF4444" : "#6366F1"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-lg">
                  No members assigned
                </div>
              )}
              <p className="text-xs text-center text-gray-400 mt-2">
                Active Tasks per Member
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
