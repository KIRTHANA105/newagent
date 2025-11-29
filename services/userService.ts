// Lightweight service to create a user profile in a Supabase (or compatible) REST endpoint.
// This file uses environment variables for the Supabase URL and anon key. In Vite,
// you can expose them via `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_KEY`.

declare const process: any;

export interface CreateUserProfilePayload {
  id: string | number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export async function createUserProfile(payload: CreateUserProfilePayload) {
  // Try both `process.env` and Vite `import.meta.env` so the developer can wire whichever is available.
  // On the frontend it's common to use `import.meta.env.VITE_*` vars.
  const SUPABASE_URL =
    (process && process.env && process.env.SUPABASE_URL) ||
    (typeof import.meta !== "undefined" &&
      (import.meta as any).env?.VITE_SUPABASE_URL);
  const SUPABASE_KEY =
    (process && process.env && process.env.SUPABASE_KEY) ||
    (typeof import.meta !== "undefined" &&
      (import.meta as any).env?.VITE_SUPABASE_KEY);

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    // No remote configured — caller should fallback to local state.
    return { success: false, reason: "Missing SUPABASE_URL or SUPABASE_KEY" };
  }

  try {
    const resp = await fetch(
      `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/user_profiles`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          id: payload.id,
          email: payload.email,
          name: payload.name,
          role: payload.role,
          avatar: payload.avatar,
          created_at: new Date().toISOString(),
        }),
      }
    );

    if (!resp.ok) {
      const text = await resp.text();
      return { success: false, reason: `HTTP ${resp.status}: ${text}` };
    }

    const data = await resp.json();
    return { success: true, data };
  } catch (err) {
    return { success: false, reason: String(err) };
  }
}
