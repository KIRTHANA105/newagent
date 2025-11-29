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
  // Check for OpenAI key first (use OPENAI_API_KEY or Vite env VITE_OPENAI_API_KEY)
  const OPENAI_KEY =
    (process && process.env && process.env.OPENAI_API_KEY) ||
    (typeof import.meta !== "undefined" &&
      (import.meta as any).env?.VITE_OPENAI_API_KEY);

  const teamsPrompt = teams
    .map((t) => `ID: ${t.id}, Name: ${t.name}, Skills: ${t.skills.join(", ")}`)
    .join("\n");

  const prompt = `You are an intelligent Task Assignment Agent for a software company.\nAnalyze the following task and assign it to the most appropriate team based on their skills.\n\nTask Title: "${title}"\nTask Description: "${description}"\n\nAvailable Teams:\n${teamsPrompt}\n\nReturn a JSON object with the 'teamId' (integer) and a short 'reasoning' (string).`;

  // If OpenAI key present, call OpenAI Chat Completions API and preserve same I/O shape
  if (OPENAI_KEY) {
    try {
      const model = "gpt-4.1"; // prefer GPT-4.1; if unavailable you may switch to gpt-4.1-mini
      const body = {
        model,
        messages: [
          {
            role: "system",
            content:
              "You are a JSON-only responder. Reply with only a JSON object.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.0,
        max_tokens: 800,
      } as any;

      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_KEY}`,
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        console.warn("OpenAI request failed", resp.status, await resp.text());
      } else {
        const json = await resp.json();
        const content = json?.choices?.[0]?.message?.content;
        if (content) {
          let extracted = content.trim();
          try {
            return JSON.parse(extracted);
          } catch {
            const first = extracted.indexOf("{");
            const last = extracted.lastIndexOf("}");
            if (first !== -1 && last !== -1 && last > first) {
              const sub = extracted.slice(first, last + 1);
              try {
                return JSON.parse(sub);
              } catch (e) {
                console.warn("Failed to parse JSON from OpenAI content:", e);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("OpenAI RAG call error:", err);
      // fall through to Gemini fallback below
    }
  }

  // Fallback to Gemini if OpenAI not available or failed
  const { ai, Type } = await getGenAIAndHelpers();

  if (!ai) {
    console.warn("No AI key provided. Using Mock RAG Agent.");
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return {
      teamId: teams[0].id,
      reasoning: "Mock RAG: Default assignment (API Key missing).",
    };
  }

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
