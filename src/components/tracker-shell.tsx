import { Link, useRouterState } from "@tanstack/react-router";
import {
  Award,
  BookOpen,
  BriefcaseBusiness,
  CalendarCheck,
  CalendarDays,
  ChevronLeft,
  FolderKanban,
  LayoutDashboard,
  Menu,
  BellRing,
  Flame,
  LogOut,
  UserRound,
  Target,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { clearAllAuth } from "@/lib/auth-session";
import { useLoginStreak } from "@/lib/streaks";

const navigation = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "History", to: "/history", icon: CalendarDays },
  { label: "Learning", to: "/learning", icon: BookOpen },
  { label: "Projects", to: "/projects", icon: FolderKanban },
  { label: "Applications", to: "/applications", icon: BriefcaseBusiness },
  { label: "Achievements", to: "/achievements", icon: Award },
  { label: "Monthly Goals", to: "/monthly-goals", icon: Target },
  { label: "Reminders", to: "/reminders", icon: BellRing },
  { label: "Profile", to: "/profile", icon: UserRound },
] as const;

export function TrackerShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { streak: loginStreak } = useLoginStreak();
  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await clearAllAuth();
    await navigate({ to: "/", replace: true });
  };

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-overlay lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-sidebar-foreground/10 bg-sidebar text-sidebar-foreground transition-[width,transform] duration-300 ${collapsed ? "w-20" : "w-64"} ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex h-20 items-center justify-between px-5">
          {!collapsed && (
            <div>
              <p className="font-display text-lg font-bold text-primary">PROVE IT.</p>
              <p className="text-[10px] uppercase text-sidebar-foreground/45">
                Daily command center
              </p>
            </div>
          )}
          <button
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden size-9 items-center justify-center rounded-md border border-sidebar-foreground/15 text-sidebar-foreground/50 transition-colors hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground lg:flex"
            onClick={() => setCollapsed((value) => !value)}
          >
            <ChevronLeft
              className={`size-4 transition-transform ${collapsed ? "rotate-180" : ""}`}
            />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {navigation.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`flex h-10 items-center gap-3 rounded-lg px-3 text-xs font-semibold transition-all ${active ? "bg-primary text-primary-foreground" : "text-sidebar-foreground/55 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground"}`}
              >
                <Icon className="size-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="m-3 rounded-lg bg-sidebar-foreground/8 p-4">
          <div className="flex items-center gap-2 text-sidebar-foreground">
            <CalendarCheck className="size-4" />
            {!collapsed && (
              <span className="text-[10px] font-semibold uppercase">College days</span>
            )}
          </div>
          {!collapsed && <p className="mt-2 text-xs text-sidebar-foreground/45">Monday – Friday</p>}
        </div>
      </aside>

      <div className={`transition-[padding] duration-300 ${collapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur-xl md:px-8">
          <button
            type="button"
            aria-label="Open navigation"
            className="flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-4" />
          </button>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground lg:flex">
            <span className="size-1.5 rounded-full bg-primary" />
            System active · Keep moving
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-xs text-foreground transition-colors ${
                loginStreak > 0
                  ? "border-warning/30 bg-warning/10"
                  : "border-border bg-card/70 text-muted-foreground"
              }`}>
              <Flame className={`size-4 ${loginStreak > 0 ? "text-warning streak-flame" : "text-muted-foreground"}`} />
              <span className="font-semibold">
                {loginStreak} day{loginStreak !== 1 ? "s" : ""} streak
              </span>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={signOut}
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] p-4 md:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
