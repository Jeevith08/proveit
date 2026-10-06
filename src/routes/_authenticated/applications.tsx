import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  BriefcaseBusiness,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  Plus,
  Search,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  UserCheck,
  UserX,
  X,
  XCircle,
} from "lucide-react";
import { useId, useMemo, useState } from "react";
import { PageHeading } from "@/components/page-heading";
import { TrackerShell } from "@/components/tracker-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { todayKey, useLiveTable, type Row } from "@/lib/live-table";
import { useActivity } from "@/lib/streaks";

export const Route = createFileRoute("/_authenticated/applications")({
  head: () => ({
    meta: [
      { title: "Applications — Prove It" },
      {
        name: "description",
        content: "Track daily job applications with stages, rounds cleared, and rejection reasons.",
      },
      { property: "og:title", content: "Career Application Pipeline" },
      {
        property: "og:description",
        content: "Maintain consistency with daily applications, rounds, and interview feedback.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ApplicationsPage,
});

export const PIPELINE_STAGES = [
  "Applied",
  "Shortlisted",
  "Interview",
  "Selected",
  "Declined",
  "Rejected",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

const ROUND_SUGGESTIONS = [
  "Round 1 (Online Assessment)",
  "Round 2 (Technical / DSA)",
  "Round 3 (System Design)",
  "Round 4 (Managerial / HR)",
  "Final Round",
  "All Rounds Cleared (Offer)",
];

const REJECTION_REASONS = [
  "Resume Screening",
  "Online Assessment (OA)",
  "Technical / DSA Round",
  "System Design Round",
  "Culture Fit / Behavioral",
  "Position Frozen / Closed",
  "Location / Budget Mismatch",
];

const DECLINE_REASONS = [
  "Didn't Like Offer / Role",
  "Low Compensation / CTC",
  "Accepted Better Offer",
  "Location / Relocation / Commute",
  "Work Culture / Work-Life Balance",
  "Bond / Contract Terms",
];

const normalizeStage = (stage?: string | null): PipelineStage => {
  if (!stage) return "Applied";
  if (stage === "Offer") return "Selected";
  if (PIPELINE_STAGES.includes(stage as PipelineStage)) return stage as PipelineStage;
  return "Applied";
};

const stageConfig: Record<
  PipelineStage,
  {
    label: string;
    icon: typeof BriefcaseBusiness;
    badgeClass: string;
    borderAccent: string;
    headerBg: string;
  }
> = {
  Applied: {
    label: "Applied",
    icon: Clock,
    badgeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25",
    borderAccent: "border-sky-500/30",
    headerBg: "bg-sky-500/10",
  },
  Shortlisted: {
    label: "Shortlisted",
    icon: Sparkles,
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
    borderAccent: "border-amber-500/30",
    headerBg: "bg-amber-500/10",
  },
  Interview: {
    label: "Interview",
    icon: BriefcaseBusiness,
    badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25",
    borderAccent: "border-indigo-500/30",
    headerBg: "bg-indigo-500/10",
  },
  Selected: {
    label: "Selected / Offer",
    icon: Trophy,
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    borderAccent: "border-emerald-500/30",
    headerBg: "bg-emerald-500/10",
  },
  Declined: {
    label: "Offer Declined",
    icon: UserX,
    badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25",
    borderAccent: "border-purple-500/30",
    headerBg: "bg-purple-500/10",
  },
  Rejected: {
    label: "Rejected",
    icon: XCircle,
    badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25",
    borderAccent: "border-rose-500/30",
    headerBg: "bg-rose-500/10",
  },
};

const inputStyle =
  "h-9 rounded-lg border border-input bg-background/80 px-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all";

function ApplicationsPage() {
  const table = useLiveTable("job_applications");
  const { toggle } = useActivity();

  // Form State
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [appliedOn, setAppliedOn] = useState(todayKey());
  const [stage, setStage] = useState<PipelineStage>("Applied");
  const [jobType, setJobType] = useState<"Full Time" | "Internship">("Full Time");
  const [round, setRound] = useState("");
  const [reason, setReason] = useState("");
  const [referralsAsked, setReferralsAsked] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilterStage, setActiveFilterStage] = useState<string>("all");

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<Row<"job_applications"> | null>(null);
  const [editCompany, setEditCompany] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editAppliedOn, setEditAppliedOn] = useState("");
  const [editStage, setEditStage] = useState<PipelineStage>("Applied");
  const [editJobType, setEditJobType] = useState<"Full Time" | "Internship">("Full Time");
  const [editRound, setEditRound] = useState("");
  const [editReason, setEditReason] = useState("");
  const [editReferrals, setEditReferrals] = useState(0);

  const today = todayKey();
  const todayApps = useMemo(
    () => table.rows.filter((r) => r.applied_on === today),
    [table.rows, today],
  );
  const todayCount = todayApps.length;

  const totalCount = table.rows.length;
  const selectedCount = table.rows.filter((r) => normalizeStage(r.stage) === "Selected").length;
  const interviewCount = table.rows.filter((r) => normalizeStage(r.stage) === "Interview").length;
  const declinedCount = table.rows.filter((r) => normalizeStage(r.stage) === "Declined").length;
  const rejectedCount = table.rows.filter((r) => normalizeStage(r.stage) === "Rejected").length;

  const handleAddApplication = async () => {
    if (!company.trim() || !role.trim()) return;
    setIsSubmitting(true);

    const payload = {
      company: company.trim().slice(0, 100),
      role: role.trim().slice(0, 100),
      stage,
      job_type: jobType,
      applied_on: appliedOn || today,
      round: stage === "Selected" || stage === "Interview" ? round.trim() || null : null,
      reason: stage === "Rejected" || stage === "Declined" ? reason.trim() || null : null,
      rejection_reason: stage === "Rejected" || stage === "Declined" ? reason.trim() || null : null,
      referrals_asked: referralsAsked,
    };

    const ok = await table.insert(payload as never);
    setIsSubmitting(false);

    if (ok) {
      setCompany("");
      setRole("");
      setAppliedOn(todayKey());
      setStage("Applied");
      setJobType("Full Time");
      setRound("");
      setReason("");
      setReferralsAsked(0);
      void toggle("application", true);
    }
  };

  const openEditModal = (item: Row<"job_applications">) => {
    setEditingItem(item);
    setEditCompany(item.company);
    setEditRole(item.role);
    setEditAppliedOn(item.applied_on);
    setEditStage(normalizeStage(item.stage));
    setEditJobType((item.job_type as "Full Time" | "Internship") ?? "Full Time");
    setEditRound(item.round ?? "");
    setEditReason(item.reason ?? item.rejection_reason ?? "");
    setEditReferrals(item.referrals_asked ?? 0);
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !editCompany.trim() || !editRole.trim()) return;

    await table.update(editingItem.id, {
      company: editCompany.trim().slice(0, 100),
      role: editRole.trim().slice(0, 100),
      stage: editStage,
      job_type: editJobType,
      applied_on: editAppliedOn || editingItem.applied_on,
      round:
        editStage === "Selected" || editStage === "Interview" ? editRound.trim() || null : null,
      reason: editStage === "Rejected" || editStage === "Declined" ? editReason.trim() || null : null,
      rejection_reason: editStage === "Rejected" || editStage === "Declined" ? editReason.trim() || null : null,
      referrals_asked: editReferrals,
    } as never);

    setEditingItem(null);
  };

  const handleStageChange = async (id: string, newStage: PipelineStage) => {
    const existing = table.rows.find((r) => r.id === id);
    if (!existing) return;

    if (newStage === "Selected" && !existing.round) {
      // Prompt user or open modal to specify which round
      openEditModal({ ...existing, stage: "Selected" });
      return;
    }
    if (newStage === "Rejected" && !existing.reason && !existing.rejection_reason) {
      // Prompt user or open modal to specify why rejected
      openEditModal({ ...existing, stage: "Rejected" });
      return;
    }
    if (newStage === "Declined" && !existing.reason && !existing.rejection_reason) {
      // Prompt user or open modal to specify why offer declined
      openEditModal({ ...existing, stage: "Declined" });
      return;
    }

    await table.update(id, { stage: newStage } as never);
  };

  const handleIncrementReferrals = async (id: string, currentCount: number) => {
    await table.update(id, { referrals_asked: currentCount + 1 } as never);
  };

  // Filtered rows for display
  const filteredRows = useMemo(() => {
    let rows = table.rows;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.company.toLowerCase().includes(q) ||
          r.role.toLowerCase().includes(q) ||
          r.applied_on.includes(q) ||
          (r.round && r.round.toLowerCase().includes(q)) ||
          (r.reason && r.reason.toLowerCase().includes(q)) ||
          (r.rejection_reason && r.rejection_reason.toLowerCase().includes(q)),
      );
    }
    if (activeFilterStage !== "all") {
      rows = rows.filter((r) => normalizeStage(r.stage) === activeFilterStage);
    }
    return rows;
  }, [table.rows, searchQuery, activeFilterStage]);

  const searchInputId = useId();

  return (
    <TrackerShell>
      <PageHeading
        eyebrow="Applications"
        title="Job Applications"
        description="Track stages, round progressions, and rejection insights."
      />

      {/* Target Status Banner */}
      <section
        className={`mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4 transition-all duration-300 ${
          todayCount >= 5
            ? "border-success/40 bg-success/5 shadow-success/20"
            : "border-primary/40 bg-primary/10"
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-lg border ${
              todayCount >= 5
                ? "border-success/50 bg-success/15 text-success"
                : "border-primary/50 bg-primary/20 text-primary"
            }`}
          >
            {todayCount >= 5 ? (
              <CheckCircle2 className="size-5" />
            ) : (
              <BriefcaseBusiness className="size-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">
                {todayCount}/5 applications logged today
              </h2>
              {todayCount >= 5 ? (
                <span className="rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-semibold text-success">
                  Daily Target Met
                </span>
              ) : (
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {5 - todayCount} more needed
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card/70 px-3 py-1.5 text-xs">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-semibold text-foreground">{totalCount}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card/70 px-3 py-1.5 text-xs">
            <span className="text-muted-foreground">Interviews:</span>
            <span className="font-semibold text-indigo-500">{interviewCount}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card/70 px-3 py-1.5 text-xs">
            <span className="text-muted-foreground">Selected:</span>
            <span className="font-semibold text-emerald-500">{selectedCount}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card/70 px-3 py-1.5 text-xs">
            <span className="text-muted-foreground">Declined:</span>
            <span className="font-semibold text-purple-500">{declinedCount}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card/70 px-3 py-1.5 text-xs">
            <span className="text-muted-foreground">Rejected:</span>
            <span className="font-semibold text-rose-500">{rejectedCount}</span>
          </div>
        </div>
      </section>

      {/* Add Application Form */}
      <section className="glass-panel mb-6 rounded-xl p-5 shadow-ember">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">Add New Company Application</h2>
          </div>
          <span className="text-[11px] text-muted-foreground">{todayKey()}</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
              Company Name <span className="text-destructive">*</span>
            </label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              maxLength={100}
              placeholder="e.g. Google, Stripe, Razorpay"
              className={`${inputStyle} w-full`}
            />
          </div>

          <div className="lg:col-span-1">
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
              Role / Position <span className="text-destructive">*</span>
            </label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              maxLength={100}
              placeholder="e.g. Software Engineer, Backend Dev"
              className={`${inputStyle} w-full`}
            />
          </div>

          <div className="lg:col-span-1">
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
              Type
            </label>
            <div className="flex gap-1.5 h-9 items-center">
              {(["Full Time", "Internship"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setJobType(t)}
                  className={`flex-1 rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition-all ${
                    jobType === t
                      ? t === "Full Time"
                        ? "border-sky-500 bg-sky-500/15 text-sky-600 dark:text-sky-400"
                        : "border-violet-500 bg-violet-500/15 text-violet-600 dark:text-violet-400"
                      : "border-border bg-card/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "Full Time" ? "Full Time" : "Internship"}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
              Applied Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={appliedOn}
                onChange={(e) => setAppliedOn(e.target.value)}
                className={`${inputStyle} w-full`}
              />
            </div>
          </div>

          <div className="lg:col-span-1">
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
              Status / Stage
            </label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as PipelineStage)}
              className={`${inputStyle} w-full font-medium`}
            >
              {PIPELINE_STAGES.map((s) => (
                <option key={s} value={s}>
                  {s === "Selected"
                    ? "Selected (Offer)"
                    : s === "Declined"
                      ? "Offer Declined (I rejected offer)"
                      : s === "Rejected"
                        ? "Rejected (by Company)"
                        : s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Section: Interview -> Which round */}
        {stage === "Interview" && (
          <div className="mt-4 rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-3.5 animate-fade-in-up">
            <div className="flex items-center gap-2">
              <Target className="size-4 text-indigo-500" />
              <label className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                Interview — Which round are you in?
              </label>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {ROUND_SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setRound(sug)}
                  className={`rounded-md border px-2 py-1 text-[11px] transition-colors ${
                    round === sug
                      ? "border-indigo-500 bg-indigo-500 text-white font-medium"
                      : "border-border bg-card/60 text-muted-foreground hover:border-indigo-500/50 hover:text-foreground"
                  }`}
                >
                  {sug}
                </button>
              ))}
            </div>

            <div className="mt-2">
              <input
                value={round}
                onChange={(e) => setRound(e.target.value)}
                maxLength={100}
                placeholder="Or type custom round (e.g. Round 2: DSA Live Coding, Final Partner Interview)"
                className={`${inputStyle} w-full bg-background`}
              />
            </div>
          </div>
        )}

        {/* Dynamic Section: Selected -> Which round / offer */}
        {stage === "Selected" && (
          <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3.5 animate-fade-in-up">
            <div className="flex items-center gap-2">
              <Trophy className="size-4 text-emerald-500" />
              <label className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Selected — Which round was cleared / offer received?
              </label>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {ROUND_SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setRound(sug)}
                  className={`rounded-md border px-2 py-1 text-[11px] transition-colors ${
                    round === sug
                      ? "border-emerald-500 bg-emerald-500 text-white font-medium"
                      : "border-border bg-card/60 text-muted-foreground hover:border-emerald-500/50 hover:text-foreground"
                  }`}
                >
                  {sug}
                </button>
              ))}
            </div>

            <div className="mt-2">
              <input
                value={round}
                onChange={(e) => setRound(e.target.value)}
                maxLength={100}
                placeholder="e.g. All Rounds Cleared, Final Partner Interview"
                className={`${inputStyle} w-full bg-background`}
              />
            </div>
          </div>
        )}

        {/* Dynamic Section: Declined -> Why turned down offer */}
        {stage === "Declined" && (
          <div className="mt-4 rounded-lg border border-purple-500/30 bg-purple-500/5 p-3.5 animate-fade-in-up">
            <div className="flex items-center gap-2">
              <UserX className="size-4 text-purple-500" />
              <label className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                Offer Declined — Why didn't you like or accept the offer?
              </label>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {DECLINE_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`rounded-md border px-2 py-1 text-[11px] transition-colors ${
                    reason === r
                      ? "border-purple-500 bg-purple-500 text-white font-medium"
                      : "border-purple-500/20 bg-card/60 text-muted-foreground hover:border-purple-500/50 hover:text-foreground"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="mt-2">
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={180}
                placeholder="Why did you decline? (e.g. Low CTC, didn't like offer role, picked another company)"
                className={`${inputStyle} w-full bg-background`}
              />
            </div>
          </div>
        )}

        {/* Dynamic Section: Rejected -> Why */}
        {stage === "Rejected" && (
          <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/5 p-3.5 animate-fade-in-up">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 text-rose-500" />
              <label className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                Reason for Rejection — Why was it rejected?
              </label>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {REJECTION_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`rounded-md border px-2 py-1 text-[11px] transition-colors ${
                    reason === r
                      ? "border-rose-500 bg-rose-500 text-white font-medium"
                      : "border-rose-500/20 bg-card/60 text-muted-foreground hover:border-rose-500/50 hover:text-foreground"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="mt-2">
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={180}
                placeholder="Add specific feedback or why (e.g. Needs better dynamic programming practice, hiring freeze)"
                className={`${inputStyle} w-full bg-background`}
              />
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
          {/* Referrals Asked counter */}
          <div className="flex items-center gap-2">
            <UserCheck className="size-4 text-violet-500 shrink-0" />
            <span className="text-[11px] font-medium text-muted-foreground">Referrals Asked:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setReferralsAsked((n) => Math.max(0, n - 1))}
                disabled={referralsAsked === 0}
                className="flex size-6 items-center justify-center rounded border border-border bg-card/60 text-xs font-bold text-muted-foreground transition-colors hover:border-violet-400 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Decrease referrals asked"
              >
                −
              </button>
              <span className="min-w-[1.75rem] rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-center text-xs font-bold text-violet-600 dark:text-violet-400">
                {referralsAsked}
              </span>
              <button
                type="button"
                onClick={() => setReferralsAsked((n) => n + 1)}
                className="flex size-6 items-center justify-center rounded border border-border bg-card/60 text-xs font-bold text-muted-foreground transition-colors hover:border-violet-400 hover:bg-violet-500/10 hover:text-violet-600"
                aria-label="Increase referrals asked"
              >
                +
              </button>
            </div>
          </div>

          <Button
            type="button"
            variant="command"
            size="sm"
            onClick={handleAddApplication}
            disabled={!company.trim() || !role.trim() || isSubmitting}
            className="h-9 px-4"
          >
            <Plus className="size-4" />
            {isSubmitting ? "Adding..." : "Add Application"}
          </Button>
        </div>

        {table.error && (
          <p className="mt-2 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
            {table.error}
          </p>
        )}
      </section>

      {/* Filter and Search Bar */}
      <section className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveFilterStage("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeFilterStage === "all"
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({table.rows.length})
          </button>
          {PIPELINE_STAGES.map((st) => {
            const count = table.rows.filter((r) => normalizeStage(r.stage) === st).length;
            const active = activeFilterStage === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setActiveFilterStage(st)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {st === "Selected" ? "Selected (Offer)" : st} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative min-w-48 flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <input
            id={searchInputId}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company, role, round, or reason..."
            className={`${inputStyle} w-full pl-8`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </section>

      {/* Pipeline Board View */}
      {filteredRows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
          <BriefcaseBusiness className="size-8 mb-3 opacity-30" />
          <p className="text-sm font-medium">No applications yet</p>
          <p className="mt-1 text-xs opacity-60">Add your first application using the form above.</p>
        </div>
      ) : (
      <div className="space-y-5">
        {PIPELINE_STAGES.map((column) => {
          const cfg = stageConfig[column];
          const Icon = cfg.icon;
          const items = filteredRows.filter((r) => normalizeStage(r.stage) === column);

          // Hide empty columns completely
          if (items.length === 0) return null;

          return (
            <section
              key={column}
              className={`glass-panel rounded-xl border border-border p-4 transition-all duration-300 ${
                column === "Selected"
                  ? "border-emerald-500/25 bg-emerald-500/[0.02]"
                  : column === "Declined"
                    ? "border-purple-500/25 bg-purple-500/[0.02]"
                    : ""
              }`}
            >
              {/* Column Header */}
              <div className="mb-3.5 flex items-center justify-between pb-2.5 border-b border-border/70">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`flex shrink-0 size-6 items-center justify-center rounded-md ${cfg.headerBg}`}>
                    <Icon className="size-3.5 text-foreground" />
                  </div>
                  <h3 className="font-display text-xs font-semibold truncate">{cfg.label}</h3>
                </div>
                <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {items.length} {items.length === 1 ? "application" : "applications"}
                </span>
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {items.map((r) => {
                  const stageNorm = normalizeStage(r.stage);
                  const itemReason = r.reason ?? r.rejection_reason;
                  const companyInitials = (r.company.trim().slice(0, 2) || "CO").toUpperCase();

                  return (
                    <article
                      key={r.id}
                      className={`group relative flex flex-col justify-between rounded-xl border bg-card p-3.5 shadow-xs transition-all hover:border-primary/50 hover:shadow-md ${
                        stageNorm === "Selected"
                          ? "border-emerald-500/40 bg-gradient-to-b from-card to-emerald-500/[0.03]"
                          : stageNorm === "Declined"
                            ? "border-purple-500/35 bg-gradient-to-b from-card to-purple-500/[0.03]"
                            : stageNorm === "Rejected"
                              ? "border-rose-500/30"
                              : "border-border"
                      }`}
                    >
                      <div>
                        {/* Company & Role header with Logo Avatar */}
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary/80 font-display text-xs font-bold text-foreground shadow-2xs">
                              {companyInitials}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-display text-xs font-semibold text-foreground truncate" title={r.company}>
                                {r.company}
                              </h4>
                              <p className="text-[11px] text-muted-foreground truncate" title={r.role}>
                                {r.role}
                              </p>
                            </div>
                          </div>

                          {/* Quick action buttons */}
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => openEditModal(r)}
                              title="Edit application"
                              aria-label="Edit application"
                              className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            >
                              <Edit3 className="size-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void table.remove(r.id)}
                              title="Delete application"
                              aria-label="Delete application"
                              className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </div>
                        </div>

                        {/* Badges / Metadata row */}
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          {r.job_type && (
                            <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${
                              r.job_type === "Internship"
                                ? "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400"
                                : "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400"
                            }`}>
                              {r.job_type === "Internship" ? "Internship" : "Full Time"}
                            </span>
                          )}

                          <span className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-background/80 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            <Calendar className="size-2.5 text-muted-foreground" />
                            {r.applied_on}
                          </span>
                        </div>

                      {/* If Selected: Display Round Cleared */}
                      {stageNorm === "Selected" && (
                        <div className="mt-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Trophy className="size-3.5 shrink-0" />
                            <span>{r.round ? `Round: ${r.round}` : "Selected / Offer"}</span>
                          </div>
                        </div>
                      )}

                      {/* If Interview: Display Current Round */}
                      {stageNorm === "Interview" && r.round && (
                        <div className="mt-2 rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2 py-1 text-[11px] text-indigo-600 dark:text-indigo-400">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Target className="size-3.5 shrink-0" />
                            <span>{r.round}</span>
                          </div>
                        </div>
                      )}

                      {/* If Declined: Display Decline Reason */}
                      {stageNorm === "Declined" && itemReason && (
                        <div className="mt-2 rounded-md border border-purple-500/25 bg-purple-500/10 px-2 py-1 text-[11px] text-purple-600 dark:text-purple-400">
                          <div className="flex items-center gap-1.5">
                            <UserX className="size-3.5 shrink-0" />
                            <span className="italic">{itemReason}</span>
                          </div>
                        </div>
                      )}

                      {/* If Rejected: Display Rejection Reason */}
                      {stageNorm === "Rejected" && itemReason && (
                        <div className="mt-2 rounded-md border border-rose-500/25 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-600 dark:text-rose-400">
                          <div className="flex items-center gap-1.5">
                            <AlertCircle className="size-3.5 shrink-0" />
                            <span className="italic">{itemReason}</span>
                          </div>
                        </div>
                      )}

                      </div>

                      {/* Footer: Referrals + Stage Switcher */}
                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/50 pt-2">
                        {/* Referrals Asked */}
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="size-3 text-violet-500 shrink-0" />
                          <span className="text-[10px] text-muted-foreground">Referrals:</span>
                          <span className="min-w-[1.25rem] rounded bg-violet-500/10 px-1 text-center text-[10px] font-bold text-violet-600 dark:text-violet-400">
                            {r.referrals_asked ?? 0}
                          </span>
                          <button
                            type="button"
                            onClick={() => void handleIncrementReferrals(r.id, r.referrals_asked ?? 0)}
                            title="Add 1 referral asked"
                            aria-label="Increment referrals asked"
                            className="flex size-5 items-center justify-center rounded border border-violet-500/30 bg-violet-500/10 text-[10px] font-bold text-violet-600 transition-colors hover:bg-violet-500/20 hover:border-violet-500/50 dark:text-violet-400"
                          >
                            +1
                          </button>
                        </div>

                        <select
                          value={stageNorm}
                          onChange={(e) =>
                            void handleStageChange(r.id, e.target.value as PipelineStage)
                          }
                          className="h-6.5 rounded border border-input bg-background/90 px-1.5 text-[10px] font-medium text-foreground transition-colors hover:border-primary/50 focus:outline-none"
                        >
                          {PIPELINE_STAGES.map((s) => (
                            <option key={s} value={s}>
                              {s === "Selected"
                                ? "Selected (Offer)"
                                : s === "Declined"
                                  ? "Offer Declined"
                                  : s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      )}

      {/* Edit Modal / Dialog */}
      <Dialog open={Boolean(editingItem)} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Application</DialogTitle>
            <DialogDescription>
              Update application status, round details, or reason for rejection.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div>
              <label className="mb-1 block text-xs font-medium">Company Name</label>
              <input
                value={editCompany}
                onChange={(e) => setEditCompany(e.target.value)}
                maxLength={100}
                className={`${inputStyle} w-full`}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium">Role / Position</label>
              <input
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                maxLength={100}
                className={`${inputStyle} w-full`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium">Applied Date</label>
                <input
                  type="date"
                  value={editAppliedOn}
                  onChange={(e) => setEditAppliedOn(e.target.value)}
                  className={`${inputStyle} w-full`}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium">Stage / Status</label>
                <select
                  value={editStage}
                  onChange={(e) => setEditStage(e.target.value as PipelineStage)}
                  className={`${inputStyle} w-full`}
                >
                  {PIPELINE_STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s === "Selected"
                        ? "Selected (Offer)"
                        : s === "Declined"
                          ? "Offer Declined (I rejected offer)"
                          : s === "Rejected"
                            ? "Rejected (by Company)"
                            : s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium">Job Type</label>
              <div className="flex gap-2">
                {(["Full Time", "Internship"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEditJobType(t)}
                    className={`flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-all ${
                      editJobType === t
                        ? t === "Full Time"
                          ? "border-sky-500 bg-sky-500/15 text-sky-600 dark:text-sky-400"
                          : "border-violet-500 bg-violet-500/15 text-violet-600 dark:text-violet-400"
                        : "border-border bg-card/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Referrals Asked in Edit Modal */}
            <div>
              <label className="mb-1.5 block text-xs font-medium">Referrals Asked</label>
              <div className="flex items-center gap-2">
                <UserCheck className="size-4 text-violet-500 shrink-0" />
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditReferrals((n) => Math.max(0, n - 1))}
                    disabled={editReferrals === 0}
                    className="flex size-7 items-center justify-center rounded border border-border bg-card/60 text-sm font-bold text-muted-foreground transition-colors hover:border-violet-400 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Decrease referrals"
                  >
                    −
                  </button>
                  <span className="min-w-[2.5rem] rounded-md border border-violet-500/30 bg-violet-500/10 py-1 text-center text-sm font-bold text-violet-600 dark:text-violet-400">
                    {editReferrals}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditReferrals((n) => n + 1)}
                    className="flex size-7 items-center justify-center rounded border border-border bg-card/60 text-sm font-bold text-muted-foreground transition-colors hover:border-violet-400 hover:bg-violet-500/10 hover:text-violet-600"
                    aria-label="Increase referrals"
                  >
                    +
                  </button>
                </div>
                <span className="text-[11px] text-muted-foreground">referrals asked for this application</span>
              </div>
            </div>

            {/* Which Round if Interview */}
            {editStage === "Interview" && (
              <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="size-3.5 text-indigo-500" />
                  <label className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    Interview — Which round are you in?
                  </label>
                </div>
                <div className="mb-2 flex flex-wrap gap-1">
                  {ROUND_SUGGESTIONS.slice(0, 4).map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setEditRound(sug)}
                      className={`rounded px-1.5 py-0.5 text-[10px] border transition-colors ${
                        editRound === sug
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
                <input
                  value={editRound}
                  onChange={(e) => setEditRound(e.target.value)}
                  maxLength={100}
                  placeholder="e.g. Round 2: Technical, Final Round"
                  className={`${inputStyle} w-full bg-background`}
                />
              </div>
            )}

            {/* Which Round if Selected */}
            {editStage === "Selected" && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="size-3.5 text-emerald-500" />
                  <label className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Selected — Which round cleared / offer received?
                  </label>
                </div>
                <div className="mb-2 flex flex-wrap gap-1">
                  {ROUND_SUGGESTIONS.slice(0, 4).map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setEditRound(sug)}
                      className={`rounded px-1.5 py-0.5 text-[10px] border transition-colors ${
                        editRound === sug
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-border bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
                <input
                  value={editRound}
                  onChange={(e) => setEditRound(e.target.value)}
                  maxLength={100}
                  placeholder="e.g. All Rounds Cleared, Final Partner Interview"
                  className={`${inputStyle} w-full bg-background`}
                />
              </div>
            )}

            {/* Reason if Declined */}
            {editStage === "Declined" && (
              <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <UserX className="size-3.5 text-purple-500" />
                  <label className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                    Why was the offer declined? (Reason / Feedback)
                  </label>
                </div>
                <div className="mb-2 flex flex-wrap gap-1">
                  {DECLINE_REASONS.slice(0, 4).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setEditReason(r)}
                      className={`rounded px-1.5 py-0.5 text-[10px] border transition-colors ${
                        editReason === r
                          ? "border-purple-500 bg-purple-500 text-white"
                          : "border-purple-500/30 bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <input
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  maxLength={180}
                  placeholder="e.g. Low CTC, didn't like role, preferred another offer"
                  className={`${inputStyle} w-full bg-background`}
                />
              </div>
            )}

            {/* Reason if Rejected */}
            {editStage === "Rejected" && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="size-3.5 text-rose-500" />
                  <label className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                    Why was it rejected? (Reason / Feedback)
                  </label>
                </div>
                <div className="mb-2 flex flex-wrap gap-1">
                  {REJECTION_REASONS.slice(0, 4).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setEditReason(r)}
                      className={`rounded px-1.5 py-0.5 text-[10px] border transition-colors ${
                        editReason === r
                          ? "border-rose-500 bg-rose-500 text-white"
                          : "border-rose-500/30 bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <input
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  maxLength={180}
                  placeholder="Add specific rejection reason or learnings"
                  className={`${inputStyle} w-full bg-background`}
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="command"
              size="sm"
              onClick={handleSaveEdit}
              disabled={!editCompany.trim() || !editRole.trim()}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TrackerShell>
  );
}
