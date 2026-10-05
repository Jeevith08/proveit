import { Link } from "@tanstack/react-router";
import { Check, ChevronRight, Clock3, Plus, Trash2, Trophy, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { TrackerShell } from "@/components/tracker-shell";
import { Button } from "@/components/ui/button";
import { CelebrationOverlay, StreakBoard } from "@/components/streak-board";
import { taskCategory, useActivity } from "@/lib/streaks";
import { todayKey, useLiveTable } from "@/lib/live-table";

type TaskStatus = "pending" | "completed" | "missed";
type Task = {
  id: string;
  title: string;
  target: string;
  reason: string;
  status: TaskStatus;
  rowId?: string | undefined;
};

const introQuote = "Kill them with your success and bury them with your smile!";

const defaultTasks: { title: string; target: string }[] = [
  { title: "Gym", target: "Daily" },
  { title: "DSA", target: "2 hrs" },
  { title: "System Design", target: "2 hrs" },
  { title: "VQAR", target: "2 hrs" },
  { title: "Project", target: "Daily" },
];

export function DashboardView() {
  const [showIntro, setShowIntro] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [reasonDrafts, setReasonDrafts] = useState<Record<string, string>>({});
  const [collegeDraft, setCollegeDraft] = useState<{
    status: "pending" | "yes" | "no";
    reason: string;
  } | null>(null);
  const [deletedTitles, setDeletedTitles] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("prove_it_deleted_missions");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const today = todayKey();

  const dailyTasks = useLiveTable("daily_tasks");
  const college = useLiveTable("college_checkins");
  const learning = useLiveTable("learning_sessions");
  const projects = useLiveTable("projects");
  const apps = useLiveTable("job_applications");
  const goals = useLiveTable("monthly_goals");

  const todayRows = dailyTasks.rows.filter(
    (r) => r.log_date === today && !deletedTitles.includes(r.title),
  );
  const activeDefaultTasks = defaultTasks.filter((d) => !deletedTitles.includes(d.title));

  const tasks: Task[] = [
    ...activeDefaultTasks.map((d) => ({ ...d, row: todayRows.find((r) => r.title === d.title) })),
    ...todayRows
      .filter((r) => !defaultTasks.some((d) => d.title === r.title))
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((r) => ({ title: r.title, target: "Flexible", row: r })),
  ].map(({ title, target, row }) => ({
    id: title,
    title,
    target,
    status: (row?.status ?? "pending") as TaskStatus,
    reason: reasonDrafts[title] ?? row?.reason ?? "",
    rowId: row?.id,
  }));

  const completed = tasks.filter((task) => task.status === "completed").length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const todayIndex = (new Date().getDay() + 6) % 7;
  const date = useMemo(
    () =>
      new Intl.DateTimeFormat("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date()),
    [],
  );

  const collegeRow = college.rows.find((r) => r.log_date === today);
  const collegeStatus =
    collegeDraft?.status ?? (collegeRow ? (collegeRow.attended ? "yes" : "no") : "pending");
  const collegeReason = collegeDraft?.reason ?? collegeRow?.reason ?? "";
  const learningToday = learning.rows
    .filter((r) => r.log_date === today)
    .reduce((s, r) => s + Number(r.hours), 0);
  const appsToday = apps.rows.filter((r) => r.applied_on === today);
  const activeProjects = projects.rows.filter(
    (p) => p.status === "building" || p.status === "planning",
  );
  const monthStart = `${today.slice(0, 7)}-01`;
  const monthGoals = goals.rows.filter((g) => g.month === monthStart);
  const goalPct = monthGoals.length
    ? Math.round(
        monthGoals.reduce((s, g) => s + Math.min(100, (g.progress / g.target) * 100), 0) /
          monthGoals.length,
      )
    : 0;

  const activity = useActivity();
  const saveTask = (title: string, status: TaskStatus, reason: string | null) =>
    dailyTasks.upsert({ log_date: today, title, status, reason }, "user_id,log_date,title");
  const setTaskStatus = (id: string, status: TaskStatus) => {
    const cat = taskCategory[id];
    if (cat) void activity.toggle(cat, status === "completed");
    if (status !== "missed")
      setReasonDrafts((d) => {
        const { [id]: _, ...rest } = d;
        return rest;
      });
    void saveTask(id, status, status === "missed" ? (reasonDrafts[id] ?? null) : null);
  };
  const setMissedReason = (id: string, reason: string) =>
    setReasonDrafts((d) => ({ ...d, [id]: reason.slice(0, 180) }));
  const commitReason = (id: string) => {
    const r = reasonDrafts[id];
    if (r !== undefined) void saveTask(id, "missed", r.trim() || null);
  };
  const saveCollege = (status: "yes" | "no", reason: string) => {
    setCollegeDraft({ status, reason });
    void college
      .upsert(
        {
          log_date: today,
          attended: status === "yes",
          reason: status === "no" ? reason.trim() || null : null,
        },
        "user_id,log_date",
      )
      .then(() => setCollegeDraft(null));
  };

  const addTask = () => {
    const title = taskName.trim().slice(0, 80);
    if (!title) return;
    if (deletedTitles.includes(title)) {
      const updated = deletedTitles.filter((t) => t !== title);
      setDeletedTitles(updated);
      try {
        localStorage.setItem("prove_it_deleted_missions", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    } else if (tasks.some((t) => t.title === title)) {
      return;
    }
    void saveTask(title, "pending", null);
    setTaskName("");
    setShowAdd(false);
  };

  const deleteTask = async (title: string, rowId?: string) => {
    const updated = Array.from(new Set([...deletedTitles, title]));
    setDeletedTitles(updated);
    try {
      localStorage.setItem("prove_it_deleted_missions", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    if (rowId) {
      await dailyTasks.remove(rowId);
    } else {
      const row = dailyTasks.rows.find((r) => r.title === title && r.log_date === today);
      if (row?.id) {
        await dailyTasks.remove(row.id);
      }
    }

    setReasonDrafts((d) => {
      const { [title]: _, ...rest } = d;
      return rest;
    });

    const cat = taskCategory[title];
    if (cat) {
      void activity.toggle(cat, false);
    }
  };

  const resetDefaultMissions = () => {
    setDeletedTitles([]);
    try {
      localStorage.removeItem("prove_it_deleted_missions");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <TrackerShell>
        <div className="mb-8 grid animate-fade-in grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">{date}</p>
            <h1 className="font-display text-2xl font-semibold md:text-3xl">
              Daily execution plan
            </h1>
            <p className="mt-2 text-xs text-muted-foreground">
              College day · Win the hours outside class.
            </p>
          </div>
          <div className="flex gap-8">
            <Metric label="Completion" value={`${progress}%`} accent />
            <Metric label="Learning today" value={`${learningToday} hrs`} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <section className="glass-panel rounded-xl p-5 md:p-7 xl:col-span-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-lg font-semibold">Today's checklist</h2>
                  {deletedTitles.length > 0 && (
                    <button
                      type="button"
                      onClick={resetDefaultMissions}
                      className="text-[11px] font-medium text-muted-foreground hover:text-foreground underline underline-offset-2 ml-2"
                    >
                      Reset defaults
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {completed} of {tasks.length} missions completed
                </p>
              </div>
              <div className="h-1.5 w-32 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              {tasks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border py-8 text-center bg-card/40">
                  <p className="text-sm font-semibold text-foreground">
                    No missions on today's checklist
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Add a new mission below to start tracking.
                  </p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`rounded-lg border p-3 transition-all duration-200 hover:-translate-y-0.5 ${task.status === "completed" ? "border-success/35 bg-success/5" : task.status === "missed" ? "border-destructive/35 bg-destructive/5" : "border-border bg-card"}`}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`flex size-6 shrink-0 items-center justify-center rounded-sm border ${task.status === "completed" ? "success-pop border-success bg-success text-primary-foreground" : task.status === "missed" ? "border-destructive text-destructive" : "border-border text-muted-foreground"}`}
                      >
                        {task.status === "completed" ? (
                          <Check className="size-4" />
                        ) : task.status === "missed" ? (
                          <X className="size-4" />
                        ) : null}
                      </span>
                      <div className="min-w-32 flex-1">
                        <p
                          className={`text-sm font-semibold ${task.status === "completed" ? "text-success" : "text-foreground"}`}
                        >
                          {task.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{task.target}</p>
                      </div>
                      <div
                        className="flex items-center gap-2"
                        aria-label={`Did you complete ${task.title}?`}
                      >
                        <Button
                          type="button"
                          size="sm"
                          variant={task.status === "completed" ? "default" : "outline"}
                          onClick={() => setTaskStatus(task.id, "completed")}
                        >
                          <Check className="size-3.5" /> Yes
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={task.status === "missed" ? "destructive" : "outline"}
                          onClick={() => setTaskStatus(task.id, "missed")}
                        >
                          <X className="size-3.5" /> No
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="size-8 text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive transition-colors ml-0.5"
                          onClick={() => deleteTask(task.title, task.rowId)}
                          title={`Delete ${task.title}`}
                          aria-label={`Delete mission ${task.title}`}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                    {task.status === "completed" && (
                      <p className="success-message mt-2 pl-9 text-xs font-semibold text-success">
                        Completed — keep the momentum going.
                      </p>
                    )}
                    {task.status === "missed" && (
                      <div className="mt-3 pl-9">
                        <label
                          htmlFor={`reason-${task.id}`}
                          className="mb-1.5 block text-xs font-medium text-foreground"
                        >
                          Why was this missed?
                        </label>
                        <input
                          id={`reason-${task.id}`}
                          value={task.reason}
                          onChange={(event) => setMissedReason(task.id, event.target.value)}
                          onBlur={() => commitReason(task.id)}
                          onKeyDown={(event) => event.key === "Enter" && commitReason(task.id)}
                          maxLength={180}
                          required
                          placeholder="Add your reason"
                          className="h-9 w-full rounded-md border border-input bg-background/60 px-3 text-xs"
                        />
                        {!task.reason.trim() && (
                          <p className="mt-1 text-[10px] text-destructive">A reason is required.</p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {showAdd ? (
              <div className="mt-5 flex gap-2">
                <input
                  value={taskName}
                  onChange={(event) => setTaskName(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && addTask()}
                  autoFocus
                  placeholder="New mission"
                  className="h-11 flex-1 rounded-md border border-input bg-background/60 px-3 text-sm"
                />
                <Button type="button" variant="command" onClick={addTask}>
                  Add
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="command"
                onClick={() => setShowAdd(true)}
                className="mt-5 h-11 w-full"
              >
                <Plus className="size-4" /> Add mission
              </Button>
            )}
          </section>

          <aside className="space-y-6 xl:col-span-4">
            <Panel title="Daily application" action={`${appsToday.length}/1`}>
              <p className="font-display text-lg font-semibold">
                {appsToday.length
                  ? `${appsToday[0]!.role} · ${appsToday[0]!.company}`
                  : "No application added"}
              </p>
              {appsToday.length > 0 &&
              (appsToday[0]?.round ||
                appsToday[0]?.reason ||
                appsToday[0]?.rejection_reason ||
                appsToday[0]?.stage) ? (
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium border ${
                      appsToday[0]!.stage === "Selected" || appsToday[0]!.stage === "Offer"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : appsToday[0]!.stage === "Rejected"
                          ? "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          : appsToday[0]!.stage === "Interview"
                            ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                            : "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400"
                    }`}
                  >
                    {appsToday[0]!.stage === "Offer" ? "Selected (Offer)" : appsToday[0]!.stage}
                  </span>
                  {appsToday[0]!.round && (
                    <span className="text-[11px] text-muted-foreground">
                      · Round: {appsToday[0]!.round}
                    </span>
                  )}
                  {(appsToday[0]!.reason || appsToday[0]!.rejection_reason) && (
                    <span className="text-[11px] text-rose-500">
                      · Reason: {appsToday[0]!.reason ?? appsToday[0]!.rejection_reason}
                    </span>
                  )}
                </div>
              ) : null}
              <p className="mt-1 text-xs text-muted-foreground">
                {appsToday.length
                  ? "Today's target is done."
                  : "Add today's application when you are ready."}
              </p>
              <Link
                to="/applications"
                className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs font-semibold text-foreground transition-colors hover:text-success"
              >
                Open application board <ChevronRight className="size-4" />
              </Link>
            </Panel>
            <Panel title="Monthly momentum" action={`${goalPct}%`}>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-primary transition-[width] duration-700"
                  style={{ width: `${goalPct}%` }}
                />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {monthGoals.length
                  ? `${monthGoals.length} target${monthGoals.length > 1 ? "s" : ""} this month`
                  : "No monthly targets added yet."}
              </p>
            </Panel>
            <section className="rounded-xl border border-border/70 bg-card/70 p-4 shadow-ember">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-bold uppercase text-muted-foreground">
                    College check-in
                  </p>
                  <h3 className="mt-1 text-sm font-semibold">Went to college today?</h3>
                </div>
                <span className="rounded-md bg-primary/35 px-2 py-1 text-[9px] font-bold">
                  Mon–Fri
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={collegeStatus === "yes" ? "default" : "outline"}
                  onClick={() => saveCollege("yes", "")}
                >
                  <Check className="size-3.5" />
                  Yes
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={collegeStatus === "no" ? "destructive" : "outline"}
                  onClick={() => saveCollege("no", collegeReason)}
                >
                  <X className="size-3.5" />
                  No
                </Button>
              </div>
              {collegeStatus === "no" && (
                <div className="mt-3">
                  <label htmlFor="college-reason" className="text-[10px] font-medium">
                    Why not?
                  </label>
                  <input
                    id="college-reason"
                    value={collegeReason}
                    onChange={(event) =>
                      setCollegeDraft({ status: "no", reason: event.target.value.slice(0, 180) })
                    }
                    onBlur={() => saveCollege("no", collegeReason)}
                    maxLength={180}
                    required
                    placeholder="Add reason"
                    className="mt-1 h-8 w-full rounded-md border border-input bg-background/50 px-2.5 text-xs"
                  />
                  {!collegeReason.trim() && (
                    <p className="mt-1 text-[9px] text-destructive">A reason is required.</p>
                  )}
                </div>
              )}
              {collegeStatus === "yes" && (
                <p className="success-message mt-3 text-[10px] font-semibold text-success">
                  Attendance checked — keep moving.
                </p>
              )}
            </section>
          </aside>

          <section className="glass-panel rounded-xl p-5 md:p-6 xl:col-span-4">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="font-display font-semibold">Learning hours</h3>
              <span className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {completed}/{tasks.length} today
                </span>
                <Clock3 className="size-4 text-foreground" />
              </span>
            </div>
            <div className="flex items-end gap-2">
              {["M", "T", "W", "T", "F", "S", "S"].map((label, index) => {
                const isToday = index === todayIndex;
                const height = isToday ? Math.round((completed / tasks.length) * 100) : 0;
                return (
                  <div key={index} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-24 w-full items-end bg-secondary/50">
                      <span
                        className={`w-full transition-all duration-500 ${isToday ? "bg-primary" : "bg-primary/80"}`}
                        style={{ height: `${height}%` }}
                        aria-label={
                          isToday
                            ? `Today's progress: ${completed} of ${tasks.length} tasks`
                            : undefined
                        }
                      />
                    </div>
                    <span
                      className={`text-[9px] ${isToday ? "font-bold text-foreground" : "text-muted-foreground"}`}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[10px] text-muted-foreground">
              Today's bar fills as you complete each task — full green when every mission is done.
            </p>
          </section>
          <section className="glass-panel rounded-xl p-5 md:p-6 xl:col-span-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display font-semibold">Active projects</h3>
              <span className="text-xs text-muted-foreground">{activeProjects.length} active</span>
            </div>
            {activeProjects.length ? (
              <ul className="space-y-2">
                {activeProjects.slice(0, 4).map((p) => (
                  <li key={p.id} className="flex justify-between text-sm">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-[10px] uppercase text-muted-foreground">{p.status}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No projects added yet.</p>
            )}
          </section>
          <section className="glass-panel rounded-xl p-5 md:p-6 xl:col-span-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display font-semibold">Latest achievement</h3>
              <Trophy className="size-4 text-warning" />
            </div>
            <p className="text-sm font-semibold">No achievements yet</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Your earned milestones will appear here.
            </p>
          </section>
          <div className="xl:col-span-12">
            <StreakBoard
              logs={activity.logs}
              onApplication={(on) => void activity.toggle("application", on)}
            />
          </div>
        </div>
      </TrackerShell>
      <CelebrationOverlay celebration={activity.celebration} onClose={activity.dismiss} />
    </>
  );
}

function Metric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="text-right">
      <p className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</p>
      <p
        className={`font-display text-2xl font-semibold ${accent ? "text-success" : "text-foreground"}`}
      >
        {value}
      </p>
    </div>
  );
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-panel rounded-xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[10px] font-bold uppercase text-muted-foreground">{title}</h3>
        <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground">
          {action}
        </span>
      </div>
      {children}
    </section>
  );
}
