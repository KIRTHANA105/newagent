import { Team } from "../types";

// Polyfill type definition for process.env to avoid TS errors
declare const process: {
  env: {
    API_KEY: string;
    [key: string]: string | undefined;
  };
};

const MODEL_NAME = "gemini-2.5-flash";


const getGenAIAndHelpers = async (): Promise<{
  ai: any | null;
  Type: any | null;
}> => {
  if (!process.env.API_KEY) return { ai: null, Type: null };
  try {
    const mod = await import("@google/genai");
    const { GoogleGenAI, Type } = mod as any;
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return { ai, Type };
  } catch (err) {
    console.warn("Failed to load @google/genai dynamically:", err);
    return { ai: null, Type: null };
  }
};

/**
 * AGENT 1: RAG Agent
 * Role: Analyzes task description and retrieves the best fitting team based on skills.
 * Architecture: Uses In-Context Retrieval (RAG) via the Prompt Context Window.
 */
export const classifyTaskAndSelectTeam = async (
  title: string,
  description: string,
  teams: Team[]
): Promise<{ teamId: number; reasoning: string } | null> => {
  const { ai, Type } = await getGenAIAndHelpers();

  // Graceful fallback if no key is present in the environment
  if (!ai) {
    console.warn("No API Key provided. Using Mock RAG Agent.");
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate "Thinking" time
    return {
      teamId: teams[0].id,
      reasoning: "Mock RAG: Default assignment (API Key missing).",
    };
  }

  // RAG Step: Inject "Knowledge Base" (Teams & Skills) into the prompt context
  const teamsPrompt = teams
    .map((t) => `ID: ${t.id}, Name: ${t.name}, Skills: ${t.skills.join(", ")}`)
    .join("\n");

  const prompt = `
    You are an intelligent Task Assignment Agent for a software company.
    Analyze the following task and assign it to the most appropriate team based on their skills.

    Task Title: "${title}"
    Task Description: "${description}"

    Available Teams:
    ${teamsPrompt}

    Return a JSON object with the 'teamId' (integer) and a short 'reasoning' (string).
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            teamId: { type: Type.INTEGER },
            reasoning: { type: Type.STRING },
          },
          required: ["teamId", "reasoning"],
        },
      },
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Classification Error:", error);
    return {
      teamId: teams[0].id,
      reasoning: "Fallback: AI Service unavailable.",
    };
  }
};

/**
 * AGENT 3: Progress Monitoring Agent
 * Role: Reads raw data and determines semantic health of the task.
 */
export const analyzeTaskHealth = async (
  taskTitle: string,
  currentProgress: number,
  daysUntilDeadline: number
): Promise<{ flagOverload: boolean; suggestion: string }> => {
  const { ai, Type } = await getGenAIAndHelpers();

  if (!ai) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    if (daysUntilDeadline < 2 && currentProgress < 50) {
      return {
        flagOverload: true,
        suggestion: "Mock Agent: Deadline imminent with low progress.",
      };
    }
    return { flagOverload: false, suggestion: "System nominal." };
  }

  const prompt = `
    Analyze the health of this task.
    Title: "${taskTitle}"
    Progress: ${currentProgress}%
    Days until deadline: ${daysUntilDeadline}

    If progress is low (< 50%) and deadline is close (< 2 days), flag as overload.
    Return JSON: { "flagOverload": boolean, "suggestion": string }
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            flagOverload: { type: Type.BOOLEAN },
            suggestion: { type: Type.STRING },
          },
          required: ["flagOverload", "suggestion"],
        },
      },
    });

    const text = response.text;
    if (!text) return { flagOverload: false, suggestion: "" };
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Health Check Error:", error);
    return { flagOverload: false, suggestion: "Error in analysis." };
  }
};
