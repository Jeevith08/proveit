import { createFileRoute } from "@tanstack/react-router";
import { addDays, format, startOfWeek } from "date-fns";
import { BookOpen, Check, CircleX, Flame, ListChecks, Target } from "lucide-react";
import { useState } from "react";
import { PageHeading } from "@/components/page-heading";
import { TrackerShell } from "@/components/tracker-shell";
import { useLiveTable } from "@/lib/live-table";
import { useActivity } from "@/lib/streaks";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [
    { title: "Progress History — Prove It" },
    { name: "description", content: "Review completed tasks, missed reasons, learning hours, streaks, and monthly target progress by date." },
    { property: "og:title", content: "Progress History" },
    { property: "og:description", content: "A date-by-date review of personal progress and learning consistency." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: HistoryPage,
});

const key = (d: Date) => format(d, "yyyy-MM-dd");

function HistoryPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const dates = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const tasks = useLiveTable("daily_tasks");
  const learning = useLiveTable("learning_sessions");
  const goals = useLiveTable("monthly_goals");
  const activity = useActivity();
  const sel = key(selectedDate);
  const dayTasks = tasks.rows.filter((r) => r.log_date === sel);
  const done = dayTasks.filter((r) => r.status === "completed");
  const missed = dayTasks.filter((r) => r.status === "missed");
  const hours = learning.rows.filter((r) => r.log_date === sel).reduce((s, r) => s + Number(r.hours), 0);
  const activeDays = new Set(activity.logs.map((l) => l.log_date));
  let streak = 0; const c = new Date(selectedDate); while (activeDays.has(key(c))) { streak++; c.setDate(c.getDate() - 1); }
  const monthGoals = goals.rows.filter((g) => g.month === `${sel.slice(0, 7)}-01`);
  const pct = monthGoals.length ? Math.round(monthGoals.reduce((s, g) => s + Math.min(100, (g.progress / g.target) * 100), 0) / monthGoals.length) : 0;
  const items = [
    { icon: ListChecks, label: "Completed tasks", value: String(done.length), detail: done.map((r) => r.title).join(", ") || "No completed tasks recorded" },
    { icon: CircleX, label: "Missed tasks", value: String(missed.length), detail: missed.map((r) => `${r.title}: ${r.reason ?? "no reason"}`).join(" · ") || "No missed-task reasons recorded" },
    { icon: BookOpen, label: "Learning hours", value: `${hours}h`, detail: hours ? "Logged on the Learning page" : "No learning sessions recorded" },
    { icon: Flame, label: "Streak", value: `${streak} day${streak === 1 ? "" : "s"}`, detail: streak ? "Active days in a row up to this date" : "No active streak on this date" },
  ];

  return (
    <TrackerShell>
      <PageHeading eyebrow="Review by date" title="Progress history" description="Look back at completed work, missed-task reasons, learning time, streaks, and monthly targets." />
      <section className="glass-panel mb-6 overflow-x-auto rounded-xl p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div><h2 className="text-sm font-semibold">Weekly completion</h2><p className="mt-1 text-xs text-muted-foreground">Select a date to review its progress.</p></div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setSelectedDate(addDays(selectedDate, -7))} className="rounded border border-border px-2 text-xs" aria-label="Previous week">‹</button>
            <span className="shrink-0 text-xs font-medium text-primary">{format(weekStart, "d MMM")} – {format(addDays(weekStart, 6), "d MMM")}</span>
            <button type="button" onClick={() => setSelectedDate(addDays(selectedDate, 7))} className="rounded border border-border px-2 text-xs" aria-label="Next week">›</button>
          </div>
        </div>
        <div className="grid min-w-[680px] grid-cols-7 gap-2">
          {dates.map((date) => {
            const k = key(date); const selected = k === sel;
            const n = tasks.rows.filter((r) => r.log_date === k && r.status === "completed").length;
            return (
               <button key={k} type="button" onClick={() => setSelectedDate(date)} className={`flex min-h-24 flex-col items-center justify-between rounded-lg border p-3 transition-colors ${selected ? "border-primary bg-primary" : "border-border bg-card hover:border-primary"}`}>
                 <span className={`text-[10px] font-semibold uppercase ${selected ? "text-primary-foreground" : "text-muted-foreground"}`}>{format(date, "EEE")}</span>
                <span className="text-lg font-semibold">{format(date, "d")}</span>
                 <span className={`flex size-5 items-center justify-center rounded-sm border ${n ? "border-success bg-success text-primary-foreground" : selected ? "border-primary-foreground" : "border-border"}`} aria-label={`${n} tasks completed`}>
                  <Check className={`size-3 ${n ? "" : "opacity-0"}`} />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div><p className="text-xs font-semibold uppercase text-primary">Selected date</p><h2 className="mt-1 text-2xl font-semibold">{format(selectedDate, "EEEE, d MMMM yyyy")}</h2></div>
            <span className="rounded-md border border-border bg-secondary px-3 py-1.5 text-xs text-muted-foreground">{dayTasks.length ? `${dayTasks.length} entries` : "No entries"}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map(({ icon: Icon, label, value, detail }) => (
               <article key={label} className="glass-panel min-h-40 rounded-xl p-5">
                 <div className="flex items-center justify-between"><Icon className="size-5 text-foreground" /><span className="text-xl font-semibold">{value}</span></div>
                <h3 className="mt-6 text-sm font-semibold">{label}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
              </article>
            ))}
          </div>
           <section className="glass-panel mt-4 rounded-xl p-5">
             <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Target className="size-5 text-foreground" /><h3 className="text-sm font-semibold">Monthly target progress</h3></div><span className="text-lg font-semibold text-foreground">{pct}%</span></div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-primary transition-[width] duration-700" style={{ width: `${pct}%` }} /></div>
            <p className="mt-3 text-xs text-muted-foreground">{monthGoals.length ? `${monthGoals.length} target${monthGoals.length > 1 ? "s" : ""} for ${format(selectedDate, "MMMM")}` : "No monthly targets for this month."}</p>
          </section>
      </section>
    </TrackerShell>
  );
}