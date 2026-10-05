import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, FileText, Flame, LoaderCircle, Upload } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { TrackerShell } from "@/components/tracker-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Prove It" },
      {
        name: "description",
        content: "Manage your private student profile, goals, resume, and streak overview.",
      },
      { property: "og:title", content: "Profile — Prove It" },
      {
        property: "og:description",
        content: "Your private student profile and consistency overview.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

type ProfileForm = {
  name: string;
  college: string;
  passoutYear: string;
  goal: string;
  tagline: string;
  passion: string;
  dream: string;
  dateOfBirth: string;
  resumePath: string | null;
};
const emptyForm: ProfileForm = {
  name: "",
  college: "",
  passoutYear: "",
  goal: "",
  tagline: "",
  passion: "",
  dream: "",
  dateOfBirth: "",
  resumePath: null,
};

import { getCurrentUser, LOCAL_PROFILE_KEY } from "@/lib/auth-session";
import { computeStreaks, useActivity, useLoginStreak } from "@/lib/streaks";

function ProfilePage() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(true);
  const { streak: loginStreak, days: loginDays } = useLoginStreak();
  const { logs: activityLogs } = useActivity();

  const allActiveDays = useMemo(() => {
    const set = new Set<string>(loginDays);
    activityLogs.forEach((l) => {
      if (l.log_date) set.add(l.log_date);
    });
    return set;
  }, [loginDays, activityLogs]);

  const activityCounts = useMemo(() => {
    const counts = new Map<string, number>();
    loginDays.forEach((d) => counts.set(d, (counts.get(d) ?? 0) + 1));
    activityLogs.forEach((l) => {
      if (l.log_date) counts.set(l.log_date, (counts.get(l.log_date) ?? 0) + 1);
    });
    return counts;
  }, [loginDays, activityLogs]);

  const bestStreak = useMemo(() => {
    return computeStreaks(allActiveDays).best;
  }, [allActiveDays]);

  useEffect(() => {
    let active = true;
    void (async () => {
      const user = await getCurrentUser();
      if (!user) return;

      // Try local profile first or remote
      let profileData: any = null;
      try {
        const { data } = await supabase
          .from("profiles")
          .select("name,college,passout_year,goal,tagline,passion,dream,date_of_birth,resume_path")
          .eq("user_id", user.id)
          .maybeSingle();
        profileData = data;
      } catch {}

      if (!profileData && typeof window !== "undefined") {
        try {
          const raw = window.localStorage.getItem(LOCAL_PROFILE_KEY);
          if (raw) profileData = JSON.parse(raw);
        } catch {}
      }

      if (active && profileData) {
        setForm({
          name: profileData.name ?? "",
          college: profileData.college ?? "",
          passoutYear: profileData.passout_year ? String(profileData.passout_year) : "",
          goal: profileData.goal ?? "",
          tagline: profileData.tagline ?? "",
          passion: profileData.passion ?? "",
          dream: profileData.dream ?? "",
          dateOfBirth: profileData.date_of_birth ?? "",
          resumePath: profileData.resume_path ?? null,
        });
        setEditing(false);
      }
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const update = (key: keyof ProfileForm, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    const year = form.passoutYear.trim() ? Number(form.passoutYear) : null;
    if (year !== null && (!Number.isInteger(year) || year < 2000 || year > 2100))
      return setError("Enter a valid pass-out year.");
    if (form.dateOfBirth && new Date(form.dateOfBirth) > new Date())
      return setError("Date of birth cannot be in the future.");

    setSaving(true);
    const user = await getCurrentUser();
    if (!user) {
      setSaving(false);
      return setError("Your session ended. Please sign in again.");
    }

    const payload = {
      user_id: user.id,
      name: form.name.trim(),
      college: form.college.trim(),
      passout_year: year,
      goal: form.goal.trim(),
      tagline: form.tagline.trim(),
      passion: form.passion.trim(),
      dream: form.dream.trim(),
      date_of_birth: form.dateOfBirth || null,
      resume_path: form.resumePath,
    };

    // Save to local storage cache immediately
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(payload));
      } catch {}
    }

    try {
      await supabase.from("profiles").upsert(payload, { onConflict: "user_id" });
    } catch {}

    setSaving(false);
    setMessage("Profile saved successfully.");
    setEditing(false);
  };
  const uploadResume = async (file: File | undefined) => {
    setError("");
    setMessage("");
    if (!file) return;
    if (file.type !== "application/pdf") return setError("Upload your resume as a PDF.");
    if (file.size > 5 * 1024 * 1024) return setError("Resume must be 5 MB or smaller.");
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setSaving(false);
      return setError("Your session ended. Please sign in again.");
    }
    const path = `${userData.user.id}/resume.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(path, file, { upsert: true, contentType: "application/pdf" });
    if (uploadError) {
      setSaving(false);
      return setError(uploadError.message);
    }
    setForm((current) => ({ ...current, resumePath: path }));
    setSaving(false);
    setMessage("Resume uploaded. Save your profile to keep it linked.");
  };
  if (loading)
    return (
      <TrackerShell>
        <div className="grid min-h-60 place-items-center">
          <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
        </div>
      </TrackerShell>
    );
  return (
    <TrackerShell>
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase text-muted-foreground">Your identity</p>
        <h1 className="mt-1 font-display text-2xl font-semibold">Student profile</h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Tell Prove It what you are working toward.
        </p>
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        {editing ? (
          <form onSubmit={save} className="glass-panel rounded-xl p-5 md:p-7">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" value={form.name} onChange={(v) => update("name", v)} max={100} />
              <Field
                label="College"
                value={form.college}
                onChange={(v) => update("college", v)}
                max={160}
              />
              <Field
                label="Pass-out year"
                value={form.passoutYear}
                onChange={(v) => update("passoutYear", v)}
                type="number"
              />
              <Field
                label="Date of birth"
                value={form.dateOfBirth}
                onChange={(v) => update("dateOfBirth", v)}
                type="date"
              />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <LongField
                label="Goal"
                value={form.goal}
                onChange={(v) => update("goal", v)}
                max={500}
              />
              <LongField
                label="Tagline"
                value={form.tagline}
                onChange={(v) => update("tagline", v)}
                max={180}
              />
              <LongField
                label="Passion"
                value={form.passion}
                onChange={(v) => update("passion", v)}
                max={300}
              />
              <LongField
                label="Dream"
                value={form.dream}
                onChange={(v) => update("dream", v)}
                max={500}
              />
            </div>
            <div className="mt-5 rounded-lg border border-dashed border-input bg-secondary/35 p-4">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-md bg-card">
                  <FileText className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold">Resume</p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {form.resumePath ? "Private PDF uploaded" : "PDF only · up to 5 MB"}
                  </p>
                </div>
                <Label
                  htmlFor="resume"
                  className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-md bg-command px-3 text-[10px] font-semibold text-card"
                >
                  <Upload className="size-3" />
                  Upload
                </Label>
                <input
                  id="resume"
                  type="file"
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  onChange={(event) => void uploadResume(event.target.files?.[0])}
                />
              </div>
            </div>
            {error && (
              <p role="alert" className="mt-4 text-xs text-destructive">
                {error}
              </p>
            )}
            {message && (
              <p role="status" className="mt-4 text-xs text-success">
                {message}
              </p>
            )}
            <Button type="submit" variant="command" className="mt-5" disabled={saving}>
              {saving && <LoaderCircle className="size-4 animate-spin" />}Save profile
            </Button>
          </form>
        ) : (
          <section className="glass-panel rounded-xl p-5 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase text-muted-foreground">
                  Saved profile
                </p>
                <h2 className="mt-1 font-display text-lg font-semibold">
                  {form.name || "Your profile"}
                </h2>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setMessage("");
                  setError("");
                  setEditing(true);
                }}
              >
                Edit
              </Button>
            </div>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["College", form.college],
                  ["Pass-out year", form.passoutYear],
                  ["Date of birth", form.dateOfBirth],
                  ["Goal", form.goal],
                  ["Tagline", form.tagline],
                  ["Passion", form.passion],
                  ["Dream", form.dream],
                  ["Resume", form.resumePath ? "Private PDF uploaded" : ""],
                ] as [string, string][]
              )
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[10px] font-bold uppercase text-muted-foreground">
                      {label}
                    </dt>
                    <dd className="mt-1 whitespace-pre-line text-xs">{value}</dd>
                  </div>
                ))}
            </dl>
            {message && (
              <p role="status" className="mt-5 text-xs text-success">
                {message}
              </p>
            )}
          </section>
        )}
        <aside className="space-y-5">
          <section className="rounded-xl bg-command p-5 text-sidebar-foreground">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase text-sidebar-foreground/50">
                  Login streak
                </p>
                <p className="mt-2 font-display text-4xl font-semibold">
                  {loginStreak}{" "}
                  <span className="text-sm font-medium">day{loginStreak !== 1 ? "s" : ""}</span>
                </p>
              </div>
              <span className={`grid size-14 place-items-center rounded-full bg-warning/15 ${loginStreak > 0 ? "streak-flame" : ""}`}>
                <Flame className={`size-7 ${loginStreak > 0 ? "text-warning" : "text-sidebar-foreground/30"}`} />
              </span>
            </div>
            <p className="mt-5 border-t border-sidebar-foreground/10 pt-4 text-xs text-sidebar-foreground/60">
              {loginStreak > 0
                ? `🔥 ${loginStreak}-day streak — you showed up. Keep it going!`
                : "Log in every day to build your streak."}
            </p>
          </section>
        </aside>
      </div>
      <div className="mt-5">
        <StreakCalendar
          loginDays={allActiveDays}
          bestStreak={bestStreak}
          totalDays={allActiveDays.size}
          activityCounts={activityCounts}
        />
      </div>
    </TrackerShell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  max?: number;
}) {
  const id = label.toLowerCase().replaceAll(" ", "-");
  return (
    <div className="flex flex-col">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        className="mt-1.5"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={max}
      />
    </div>
  );
}
function LongField({
  label,
  value,
  onChange,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  max: number;
}) {
  const id = label.toLowerCase();
  return (
    <div className="flex flex-col">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        className="mt-1.5 min-h-20 resize-none"
        value={value}
        onChange={(event) => onChange(event.target.value.slice(0, max))}
        maxLength={max}
      />
    </div>
  );
}
const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""];
const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

function StreakCalendar({
  loginDays,
  bestStreak,
  totalDays,
  activityCounts,
}: {
  loginDays: Set<string>;
  bestStreak: number;
  totalDays: number;
  activityCounts?: Map<string, number>;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today.getFullYear(), today.getMonth() - 11, 1);
  const blocks = Array.from({ length: 12 }, (_, m) => {
    const first = new Date(start.getFullYear(), start.getMonth() + m, 1);
    const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
    const offset = (first.getDay() + 6) % 7;
    const cells: (Date | null)[] = Array.from({ length: offset }, () => null);
    for (let d = 1; d <= last.getDate(); d++)
      cells.push(new Date(first.getFullYear(), first.getMonth(), d));
    while (cells.length % 7) cells.push(null);
    const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
    return {
      label: MONTH_LABELS[first.getMonth()]!,
      key: `${first.getFullYear()}-${first.getMonth()}`,
      weeks,
    };
  });
  const rangeLabel = `${dateFormatter.format(start)} — ${dateFormatter.format(today)}`;
  return (
    <section className="glass-panel rounded-xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase text-muted-foreground">Consistency map</p>
          <p className="mt-1 text-sm font-semibold">
            <span className="font-display">{totalDays}</span> active days in the past one year
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">{rangeLabel}</p>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <span>
            Total active days: <span className="font-semibold text-foreground">{totalDays}</span>
          </span>
          <span>
            Max streak: <span className="font-semibold text-foreground">{bestStreak}</span>
          </span>
          <CalendarDays className="size-4 shrink-0" />
        </div>
      </div>
      <div className="mt-4 overflow-x-auto pb-1">
        <div className="flex w-fit gap-2" aria-label="One year activity map">
          <div className="grid shrink-0 grid-rows-7 gap-[3px]">
            {DAY_LABELS.map((label, index) => (
              <span
                key={index}
                className="flex h-3 items-center text-[9px] leading-none text-muted-foreground"
              >
                {label}
              </span>
            ))}
          </div>
          {blocks.map((block) => (
            <div key={block.key} className="flex shrink-0 flex-col items-center">
              <div className="flex gap-[3px]">
                {block.weeks.map((week, wi) => (
                  <div key={wi} className="grid grid-rows-7 gap-[3px]">
                    {week.map((date, di) => {
                      if (!date) return <span key={di} className="size-3" />;
                      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                      const isFuture = date.getTime() > today.getTime();
                      const count = activityCounts?.get(dateKey) ?? (loginDays.has(dateKey) ? 1 : 0);
                      let colorClass = "bg-secondary";
                      if (isFuture) {
                        colorClass = "bg-secondary/40";
                      } else if (count >= 3) {
                        colorClass = "bg-primary";
                      } else if (count === 2) {
                        colorClass = "bg-primary/65";
                      } else if (count >= 1) {
                        colorClass = "bg-primary/35";
                      }
                      return (
                        <span
                          key={di}
                          title={`${dateFormatter.format(date)}${count > 0 ? `: ${count} activity${count > 1 ? "ies" : ""}` : ""}`}
                          className={`size-3 rounded-[3px] transition-colors ${colorClass}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
              <span className="mt-2 text-[10px] font-medium text-muted-foreground">
                {block.label}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2 text-[10px] text-muted-foreground">
        <span>Less</span>
        <span className="size-3 rounded-[3px] bg-secondary" />
        <span className="size-3 rounded-[3px] bg-primary/35" />
        <span className="size-3 rounded-[3px] bg-primary/65" />
        <span className="size-3 rounded-[3px] bg-primary" />
        <span>More</span>
      </div>
    </section>
  );
}

