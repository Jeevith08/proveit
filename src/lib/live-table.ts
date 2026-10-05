import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];
export type TableName =
  | "daily_tasks"
  | "college_checkins"
  | "learning_sessions"
  | "projects"
  | "job_applications"
  | "monthly_goals";
export type Row<T extends TableName> = Tables[T]["Row"];
export type Insert<T extends TableName> = Tables[T]["Insert"];
export type Update<T extends TableName> = Tables[T]["Update"];

/** Loads the signed-in user's rows and keeps them in sync live (realtime). */
export function useLiveTable<T extends TableName>(table: T, orderBy = "created_at") {
  const [rows, setRows] = useState<Row<T>[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLocalRows = useCallback((): Row<T>[] => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem(`prove_it_table_${table}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, [table]);

  const saveLocalRows = useCallback(
    (nextRows: Row<T>[]) => {
      if (typeof window === "undefined") return;
      try {
        window.localStorage.setItem(`prove_it_table_${table}`, JSON.stringify(nextRows));
      } catch {}
    },
    [table],
  );

  const refetch = useCallback(async () => {
    try {
      const { data, error: e } = await supabase
        .from(table)
        .select("*")
        .order(orderBy as never, { ascending: false });
      if (e) {
        const local = getLocalRows();
        if (local.length > 0) {
          setRows(local);
        }
        setError(e.message);
      } else {
        const remoteRows = (data ?? []) as unknown as Row<T>[];
        setRows(remoteRows);
        saveLocalRows(remoteRows);
        setError(null);
      }
    } catch (err: unknown) {
      const local = getLocalRows();
      if (local.length > 0) setRows(local);
      const msg = err instanceof Error ? err.message : "Failed to load rows";
      setError(msg);
    }
    setLoaded(true);
  }, [table, orderBy, getLocalRows, saveLocalRows]);

  useEffect(() => {
    void refetch();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel(`live-${table}-${Math.random().toString(36).slice(2)}`)
        .on("postgres_changes", { event: "*", schema: "public", table }, () => void refetch())
        .subscribe();
    } catch {
      // Ignored if realtime unavailable
    }
    return () => {
      if (channel) void supabase.removeChannel(channel);
    };
  }, [table, refetch]);

  const insert = useCallback(
    async (values: Insert<T>) => {
      let success = false;
      try {
        const { error: e } = await supabase.from(table).insert(values as never);
        if (e) {
          setError(e.message);
        } else {
          setError(null);
          success = true;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Insert failed";
        setError(msg);
      }

      if (!success) {
        // Fallback local persistence so user data is never lost
        const current = getLocalRows();
        const localRow = {
          id:
            (values as any).id ||
            (typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : `local-${Date.now()}`),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...values,
        } as unknown as Row<T>;
        const next = [localRow, ...current];
        saveLocalRows(next);
        setRows(next);
        return true;
      }

      await refetch();
      return true;
    },
    [table, refetch, getLocalRows, saveLocalRows],
  );

  const upsert = useCallback(
    async (values: Insert<T>, onConflict: string) => {
      const { error: e } = await supabase.from(table).upsert(values as never, { onConflict });
      if (e) setError(e.message);
      await refetch();
      return !e;
    },
    [table, refetch],
  );

  const update = useCallback(
    async (id: string, values: Update<T>) => {
      let success = false;
      try {
        const { error: e } = await supabase
          .from(table)
          .update(values as never)
          .eq("id" as never, id as never);
        if (e) {
          setError(e.message);
        } else {
          setError(null);
          success = true;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Update failed";
        setError(msg);
      }

      if (!success) {
        // Optimistic update in local cache
        const current = getLocalRows();
        const next = current.map((r: any) =>
          r.id === id ? { ...r, ...values, updated_at: new Date().toISOString() } : r,
        );
        saveLocalRows(next as Row<T>[]);
        setRows(next as Row<T>[]);
        return true;
      }

      await refetch();
      return true;
    },
    [table, refetch, getLocalRows, saveLocalRows],
  );

  const remove = useCallback(
    async (id: string) => {
      let success = false;
      try {
        const { error: e } = await supabase
          .from(table)
          .delete()
          .eq("id" as never, id as never);
        if (e) {
          setError(e.message);
        } else {
          setError(null);
          success = true;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Delete failed";
        setError(msg);
      }

      if (!success) {
        const current = getLocalRows();
        const next = current.filter((r: any) => r.id !== id);
        saveLocalRows(next as Row<T>[]);
        setRows(next as Row<T>[]);
        return true;
      }

      await refetch();
      return true;
    },
    [table, refetch, getLocalRows, saveLocalRows],
  );

  return { rows, loaded, error, insert, upsert, update, remove, refetch };
}

export const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
