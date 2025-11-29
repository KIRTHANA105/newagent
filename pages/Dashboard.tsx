import React, { useMemo, useState } from "react";
import { useStore } from "../context/Store";
import { Task } from "../types";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Bot,
  ShieldAlert,
  Activity,
} from "lucide-react";

const COLORS = ["#10B981", "#F59E0B", "#EF4444", "#6366F1"];

const TaskItem: React.FC<{ task: Task }> = ({ task }) => {
  const { users, teams, currentUser, updateTaskProgress } = useStore();
  const assignee = users.find((u) => u.id === task.assigned_member_id);
  const team = teams.find((t) => t.id === task.assigned_team_id);
  const isOverdue =
    new Date(task.deadline) < new Date() && task.status !== "Completed";

  return (
    <div
      className={`bg-white p-5 rounded-xl border ${
        task.overload_flag ? "border-red-300 bg-red-50" : "border-gray-100"
      } shadow-sm hover:shadow-md transition-all`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-bold text-gray-900">{task.title}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {team?.name}
            </span>
            {task.overload_flag && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 flex items-center gap-1">
                <AlertCircle size={10} /> Overload
              </span>
            )}
          </div>
        </div>
        <div
          className={`px-2 py-1 rounded text-xs font-bold ${
            task.status === "Completed"
              ? "bg-emerald-100 text-emerald-700"
              : task.status === "InProgress"
              ? "bg-blue-100 text-blue-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {task.status}
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4 line-clamp-2">
        {task.description}
      </p>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2">
          {assignee && (
            <img
              src={assignee.avatar}
              alt={assignee.name}
              className="w-6 h-6 rounded-full"
              title={assignee.name}
            />
          )}
          <span className="text-xs text-gray-400">
            {new Date(task.deadline).toLocaleDateString()}
          </span>
          {isOverdue && (
            <span className="text-xs text-red-500 font-bold">Overdue</span>
          )}
        </div>

        {currentUser?.role !== "admin" && task.status !== "Completed" && (
          <div className="flex items-center gap-1">
            <input
              type="range"
              min="0"
              max="100"
              value={task.progress}
              onChange={(e) =>
                updateTaskProgress(task.id, parseInt(e.target.value))
              }
              className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs font-mono w-8 text-right">
              {task.progress}%
            </span>
          </div>
        )}
        {task.status === "Completed" && (
          <CheckCircle2 size={20} className="text-emerald-500" />
        )}
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const { currentUser, tasks, teams, triggerAIHealthCheck } = useStore();
  const [agentStatus, setAgentStatus] = useState<
    null | "PROGRESS" | "REASSIGNMENT"
  >(null);

  const filteredTasks = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === "admin") return tasks;
    if (currentUser.role === "team_lead") {
      const myTeam = teams.find((t) => t.lead_id === currentUser.id);
      return tasks.filter((t) => t.assigned_team_id === myTeam?.id);
    }
    return tasks.filter((t) => t.assigned_member_id === currentUser.id);
  }, [currentUser, tasks, teams]);

  const stats = useMemo(() => {
    const completed = filteredTasks.filter(
      (t) => t.status === "Completed"
    ).length;
    const inProgress = filteredTasks.filter(
      (t) => t.status === "InProgress"
    ).length;
    const pending = filteredTasks.filter((t) => t.status === "Pending").length;
    return [
      { name: "Completed", value: completed, color: "#10B981" },
      { name: "In Progress", value: inProgress, color: "#3B82F6" },
      { name: "Pending", value: pending, color: "#F59E0B" },
    ];
  }, [filteredTasks]);

  const handleRunAgents = async () => {
    // Artificial visual delay to show distinct agents
    setAgentStatus("PROGRESS");
    await new Promise((r) => setTimeout(r, 1000));

    setAgentStatus("REASSIGNMENT");
    await triggerAIHealthCheck(); // This runs the actual logic
    await new Promise((r) => setTimeout(r, 800));

    setAgentStatus(null);
  };

  return (
    <div className="relative">
      {/* Agent Modal Overlay */}
      {agentStatus && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center animate-in zoom-in duration-200">
            {agentStatus === "PROGRESS" && (
              <>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="text-blue-600 animate-pulse" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Progress Agent
                </h3>
                <p className="text-gray-500 mt-2">
                  Scanning task deadlines and member updates for anomalies...
                </p>
              </>
            )}
            {agentStatus === "REASSIGNMENT" && (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert
                    className="text-red-600 animate-bounce"
                    size={32}
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Reassignment Agent
                </h3>
                <p className="text-gray-500 mt-2">
                  Calculating optimizations and re-routing overloaded tasks...
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {currentUser?.role === "admin"
              ? "System Overview"
              : currentUser?.role === "team_lead"
              ? "Team Dashboard"
              : "My Tasks"}
          </h2>
          <p className="text-gray-500">Welcome back, {currentUser?.name}</p>
        </div>

        {currentUser?.role === "admin" && (
          <button
            onClick={handleRunAgents}
            disabled={!!agentStatus}
            className={`flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all font-medium shadow-md ${
              agentStatus ? "opacity-80" : ""
            }`}
          >
            {agentStatus ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Agents Active...
              </>
            ) : (
              <>
                <Bot size={18} />
                Run AI Agents
              </>
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <span className="text-gray-400 text-sm font-medium">
              Total Tasks
            </span>
            <span className="text-4xl font-bold text-gray-900">
              {filteredTasks.length}
            </span>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <span className="text-gray-400 text-sm font-medium">Completed</span>
            <span className="text-4xl font-bold text-emerald-600">
              {stats[0].value}
            </span>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <span className="text-gray-400 text-sm font-medium">Pending</span>
            <span className="text-4xl font-bold text-yellow-500">
              {stats[2].value}
            </span>
          </div>
        </div>

        {/* Simple Chart */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="w-full" style={{ height: '200px', minHeight: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-bold text-gray-800 mb-4">Active Tasks</h3>
      {filteredTasks.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">No active tasks found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
};
