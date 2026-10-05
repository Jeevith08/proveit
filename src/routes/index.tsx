import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getLocalUser } from "@/lib/auth-session";
import { LandingPage } from "@/components/landing-page";
import { DashboardView } from "@/components/dashboard-view";
import type { User } from "@supabase/supabase-js";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Prove It — Daily Command Center" },
      {
        name: "description",
        content:
          "Personal tracker for daily learning, college check-in, projects, job applications, and streaks.",
      },
      { property: "og:title", content: "Prove It — Daily Command Center" },
      { property: "og:description", content: "Stay locked in. Win the hours outside class." },
    ],
  }),
  component: RootIndexPage,
});

function RootIndexPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    async function checkAuth() {
      // Set a maximum 1.5s timeout so unreachable Supabase DNS doesn't cause infinite loading
      timeoutId = setTimeout(() => {
        if (mounted) {
          console.warn(
            "Supabase auth check timed out (unreachable host or network issue). Showing landing page.",
          );
          setUser(null);
          setCheckingAuth(false);
        }
      }, 1500);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
        } else {
          const local = getLocalUser();
          setUser(local);
        }
      } catch (e: unknown) {
        console.error("Auth check error:", e);
        const local = getLocalUser();
        if (mounted) setUser(local);
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
        if (mounted) setCheckingAuth(false);
      }
    }

    void checkAuth();

    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!mounted) return;
        setUser(session?.user ?? null);
        setCheckingAuth(false);
      });
      subscription = data.subscription;
    } catch {
      // Ignored if client failed
    }

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      subscription?.unsubscribe();
    };
  }, [navigate]);

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-command font-body text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary font-display text-xl font-bold text-primary-foreground shadow-lg shadow-primary/20 animate-pulse">
            P
          </div>
          <p className="font-display text-xs font-semibold tracking-widest text-white/50 uppercase">
            Loading Command Center...
          </p>
        </div>
      </div>
    );
  }

  if (user) {
    return <DashboardView />;
  }

  return <LandingPage />;
}
