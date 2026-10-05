import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const LOCAL_USER_KEY = "prove_it_local_user";
export const LOCAL_PROFILE_KEY = "prove_it_local_profile";

export function getLocalUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setLocalUser(user: User | null): void {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      window.localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(LOCAL_USER_KEY);
    }
  } catch {}
}

export function createLocalUser(email: string): User {
  const cleanEmail = email.trim().toLowerCase();
  const user: User = {
    id: "local-user-" + cleanEmail.replace(/[^a-zA-Z0-9]/g, "_"),
    app_metadata: { provider: "email" },
    user_metadata: { name: cleanEmail.split("@")[0] },
    aud: "authenticated",
    email: cleanEmail,
    created_at: new Date().toISOString(),
  } as User;
  setLocalUser(user);

  // Initialize a default local profile so user lands straight on the dashboard
  try {
    const existing = window.localStorage.getItem(LOCAL_PROFILE_KEY);
    if (!existing) {
      window.localStorage.setItem(
        LOCAL_PROFILE_KEY,
        JSON.stringify({
          user_id: user.id,
          name: cleanEmail.split("@")[0],
          college: "College / University",
          passout_year: "2026",
          goal: "Software Engineer",
          tagline: "Consistent Daily Execution",
          passion: "Full Stack Development & DSA",
          dream: "Product Engineer",
          date_of_birth: "",
          resume_path: null,
        }),
      );
    }
  } catch {}

  return user;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const timeout = new Promise<{ data: { user: null }; error: Error }>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), 1500),
    );
    const res = await Promise.race([supabase.auth.getUser(), timeout]);
    if (res.data?.user) return res.data.user;
  } catch {}
  return getLocalUser();
}

export async function clearAllAuth(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {}
  setLocalUser(null);
  if (typeof window !== "undefined") {
    try {
      for (let i = window.localStorage.length - 1; i >= 0; i--) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith("sb-") && k.endsWith("-auth-token")) {
          window.localStorage.removeItem(k);
        }
      }
    } catch {}
  }
}
