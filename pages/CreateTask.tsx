import React, { useState } from "react";
import { useStore } from "../context/Store";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Loader2,
  Calendar,
  BrainCircuit,
  UserCog,
} from "lucide-react";

export const CreateTask = () => {
  const { createTask } = useStore();
  const navigate = useNavigate();
  const [loadingStep, setLoadingStep] = useState<null | "RAG" | "ASSIGNMENT">(
    null
  );
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    deadline: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Visual feedback for Agent 1
      setLoadingStep("RAG");
      // We delay slightly to allow the UI to render the state change (in a real app this happens naturally due to API latency)

      await createTask(formData.title, formData.description, formData.deadline);

      // In the store, the assignment happens immediately after RAG, but we can visualize it here if we wanted to split the call
      setLoadingStep("ASSIGNMENT");
      await new Promise((r) => setTimeout(r, 800)); // Artificial delay just to show the user the 2nd agent is working

      navigate("/");
    } catch (err) {
      console.error(err);
      setLoadingStep(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Create New Task</h2>
        <p className="text-gray-500">
          Define the task and let our Multi-Agent System handle the logistics.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden"
      >
        {/* Agent Overlay */}
        {loadingStep && (
          <div className="absolute inset-0 bg-white/90 z-10 flex flex-col items-center justify-center text-center p-6 backdrop-blur-sm">
            {loadingStep === "RAG" && (
              <div className="animate-in fade-in zoom-in duration-300">
                <div className="bg-indigo-100 p-4 rounded-full inline-block mb-4">
                  <BrainCircuit
                    className="text-indigo-600 animate-pulse"
                    size={48}
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  RAG Agent Active
                </h3>
                <p className="text-gray-500 mt-2">
                  Analyzing requirements and matching skills to database...
                </p>
              </div>
            )}
            {loadingStep === "ASSIGNMENT" && (
              <div className="animate-in fade-in zoom-in duration-300">
                <div className="bg-purple-100 p-4 rounded-full inline-block mb-4">
                  <UserCog
                    className="text-purple-600 animate-bounce"
                    size={48}
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Assignment Agent Active
                </h3>
                <p className="text-gray-500 mt-2">
                  Balancing team workload and selecting best member...
                </p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Task Title
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="e.g. Implement OAuth2 Login"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              required
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
              placeholder="Describe the task in detail. The RAG Agent will use this to find the best team."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
            <div className="mt-2 flex items-center gap-2 text-xs text-indigo-600 font-medium bg-indigo-50 p-2 rounded-lg border border-indigo-100">
              <BrainCircuit size={14} />
              <span>
                RAG Agent will analyze this text for skill extraction.
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Deadline
            </label>
            <div className="relative">
              <input
                type="date"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all pl-11"
                value={formData.deadline}
                onChange={(e) =>
                  setFormData({ ...formData, deadline: e.target.value })
                }
              />
              <Calendar
                className="absolute left-4 top-3.5 text-gray-400"
                size={18}
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={!!loadingStep}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loadingStep ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Launch Agents
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
