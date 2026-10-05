import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "./auth-session";

export type Category = "gym" | "dsa" | "system_design" | "vqar" | "project" | "application" | "login";
export type Log = { log_date: string; category: Category };
export type TrackKey = "gym" | "study" | "project" | "application";

export const TRACKS: { key: TrackKey; label: string; categories: Category[] }[] = [
  { key: "gym", label: "Gym sessions", categories: ["gym"] },
  { key: "study", label: "Study hours", categories: ["dsa", "system_design", "vqar"] },
  { key: "project", label: "Project work", categories: ["project"] },
  { key: "application", label: "Daily applications", categories: ["application"] },
];
export const MILESTONES = [3, 7, 14, 30, 60, 100];

export const taskCategory: Record<string, Category> = {
  Gym: "gym",
  DSA: "dsa",
  "System Design": "system_design",
  VQAR: "vqar",
  Project: "project",
};

export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function computeStreaks(days: Set<string>) {
  const sorted = [...days].sort();
  let best = 0,
    run = 0,
    prev: Date | null = null;
  for (const s of sorted) {
    const d = new Date(`${s}T00:00:00`);
    run = prev && Math.round((d.getTime() - prev.getTime()) / 86400000) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1); // today still open
  let current = 0;
  while (days.has(dayKey(cursor))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { current, best };
}

export function trackStats(logs: Log[]) {
  return TRACKS.map((t) => {
    const days = new Set(
      logs.filter((l) => t.categories.includes(l.category)).map((l) => l.log_date),
    );
    return { ...t, ...computeStreaks(days), total: days.size };
  });
}

export type Celebration = { track: string; milestone: number } | null;

export function useActivity() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [celebration, setCelebration] = useState<Celebration>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      let loadedLogs: Log[] = [];
      try {
        const { data } = await supabase.from("activity_logs").select("log_date,category");
        if (data && data.length > 0) loadedLogs = data as Log[];
      } catch {}

      if (loadedLogs.length === 0 && typeof window !== "undefined") {
        try {
          const cached = window.localStorage.getItem("prove_it_local_activity_logs");
          if (cached) loadedLogs = JSON.parse(cached);
        } catch {}
      }

      if (active) {
        setLogs(loadedLogs);
        setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const toggle = useCallback(async (category: Category, on: boolean) => {
    const user = await getCurrentUser();
    if (!user) return;
    const today = dayKey();
    if (on) {
      try {
        await supabase
          .from("activity_logs")
          .upsert(
            { user_id: user.id, log_date: today, category },
            { onConflict: "user_id,log_date,category", ignoreDuplicates: true },
          );
      } catch {}

      setLogs((prev) => {
        if (prev.some((l) => l.log_date === today && l.category === category)) return prev;
        const before = trackStats(prev);
        const next = [...prev, { log_date: today, category }];
        const after = trackStats(next);

        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem("prove_it_local_activity_logs", JSON.stringify(next));
          } catch {}
        }

        after.forEach((t, i) => {
          const hit = MILESTONES.filter((m) => t.best >= m && before[i]!.best < m).pop();
          const key = `prove-it-milestone-${user.id}-${t.key}-${hit}`;
          if (hit && !localStorage.getItem(key)) {
            localStorage.setItem(key, "1");
            setCelebration({ track: t.label, milestone: hit });
          }
        });
        return next;
      });
    } else {
      try {
        await supabase
          .from("activity_logs")
          .delete()
          .eq("user_id", user.id)
          .eq("log_date", today)
          .eq("category", category);
      } catch {}

      setLogs((prev) => {
        const next = prev.filter((l) => !(l.log_date === today && l.category === category));
        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem("prove_it_local_activity_logs", JSON.stringify(next));
          } catch {}
        }
        return next;
      });
    }
  }, []);

  return { logs, loaded, toggle, celebration, dismiss: () => setCelebration(null) };
}

/**
 * Records a "login" activity for today (once per day, idempotent) and
 * returns the current consecutive login-streak count in real time.
 */
function getInitialLoginDays(): Set<string> {
  const s = new Set<string>();
  const today = dayKey();
  s.add(today);
  if (typeof window !== "undefined") {
    try {
      const cached = window.localStorage.getItem("prove_it_login_days");
      if (cached) {
        const arr = JSON.parse(cached);
        if (Array.isArray(arr)) arr.forEach((d) => s.add(String(d)));
      }
      const localLogs = window.localStorage.getItem("prove_it_local_activity_logs");
      if (localLogs) {
        const parsed = JSON.parse(localLogs);
        if (Array.isArray(parsed)) {
          parsed.forEach((l: { log_date?: string }) => {
            if (l.log_date) s.add(String(l.log_date));
          });
        }
      }
    } catch {}
  }
  return s;
}

export function useLoginStreak() {
  const [days, setDays] = useState<Set<string>>(getInitialLoginDays);
  const [streak, setStreak] = useState<number>(() => computeStreaks(getInitialLoginDays()).current);

  useEffect(() => {
    let active = true;

    async function init() {
      const today = dayKey();
      const loginDays = getInitialLoginDays();
      loginDays.add(today);

      try {
        const user = await getCurrentUser();

        // 1. Fetch remote login records if user is logged in
        if (user && !user.id.startsWith("local-user-")) {
          try {
            const { data } = await supabase
              .from("activity_logs")
              .select("log_date")
              .eq("user_id", user.id)
              .eq("category", "login");
            if (data && data.length > 0) {
              data.forEach((r: { log_date: string }) => loginDays.add(r.log_date));
            }

            // 2. Upsert today's login in Supabase
            await supabase
              .from("activity_logs")
              .upsert(
                { user_id: user.id, log_date: today, category: "login" },
                { onConflict: "user_id,log_date,category", ignoreDuplicates: true },
              );
          } catch {}
        }
      } catch {}

      // 3. Persist updated days locally
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem("prove_it_login_days", JSON.stringify([...loginDays]));
        } catch {}
      }

      // 4. Update state
      if (!active) return;
      setDays(new Set(loginDays));
      setStreak(computeStreaks(loginDays).current);
    }

    void init();
    return () => {
      active = false;
    };
  }, []);

  return { streak, days };
}
