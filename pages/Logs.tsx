import React from "react";
import { useStore } from "../context/Store";
import { Terminal, Cpu } from "lucide-react";

export const Logs = () => {
  const { agentLogs } = useStore();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-center gap-3">
        <div className="p-3 bg-gray-900 rounded-lg text-green-400">
          <Terminal size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Agent Activity Logs
          </h2>
          <p className="text-gray-500">
            Transparent audit trail of AI decision making.
          </p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-800 font-mono text-sm">
        <div className="bg-gray-800 px-6 py-3 border-b border-gray-700 flex justify-between items-center">
          <span className="text-gray-400">console_output.log</span>
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
        </div>
        <div className="p-6 h-[500px] overflow-y-auto space-y-4">
          {agentLogs.length === 0 && (
            <div className="text-gray-600 text-center py-10">
              Waiting for agent activity...
            </div>
          )}
          {agentLogs.map((log) => (
            <div key={log.id} className="flex gap-4 group">
              <span className="text-gray-500 whitespace-nowrap min-w-[150px]">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <div className="flex gap-3">
                <span
                  className={`font-bold uppercase tracking-wider ${
                    log.agent_name === "RAG"
                      ? "text-blue-400"
                      : log.agent_name === "Assignment"
                      ? "text-purple-400"
                      : log.agent_name === "Reassignment"
                      ? "text-red-400"
                      : "text-green-400"
                  }`}
                >
                  [{log.agent_name}]
                </span>
                <span className="text-gray-300">{log.action}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
