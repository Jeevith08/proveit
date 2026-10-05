import { createFileRoute } from "@tanstack/react-router";
import {
  BriefcaseBusiness,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  Filter,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Trophy,
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
  const [round, setRound] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formExpanded, setFormExpanded] = useState(false);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilterStage, setActiveFilterStage] = useState<string>("all");

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<Row<"job_applications"> | null>(null);
  const [editCompany, setEditCompany] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editAppliedOn, setEditAppliedOn] = useState("");
  const [editStage, setEditStage] = useState<PipelineStage>("Applied");
  const [editRound, setEditRound] = useState("");
  const [editReason, setEditReason] = useState("");

  const today = todayKey();
  const todayApps = useMemo(
    () => table.rows.filter((r) => r.applied_on === today),
    [table.rows, today],
  );
  const todayCount = todayApps.length;

  const totalCount = table.rows.length;
  const selectedCount = table.rows.filter((r) => normalizeStage(r.stage) === "Selected").length;
  const interviewCount = table.rows.filter((r) => normalizeStage(r.stage) === "Interview").length;
  const rejectedCount = table.rows.filter((r) => normalizeStage(r.stage) === "Rejected").length;

  const handleAddApplication = async () => {
    if (!company.trim() || !role.trim()) return;
    setIsSubmitting(true);

    const payload = {
      company: company.trim().slice(0, 100),
      role: role.trim().slice(0, 100),
      stage,
      applied_on: appliedOn || today,
      round: stage === "Selected" || stage === "Interview" ? round.trim() || null : null,
      reason: stage === "Rejected" ? reason.trim() || null : null,
      rejection_reason: stage === "Rejected" ? reason.trim() || null : null,
    };

    const ok = await table.insert(payload as never);
    setIsSubmitting(false);

    if (ok) {
      setCompany("");
      setRole("");
      setAppliedOn(todayKey());
      setStage("Applied");
      setRound("");
      setReason("");
      setFormExpanded(false);
      void toggle("application", true);
    }
  };

  const openEditModal = (item: Row<"job_applications">) => {
    setEditingItem(item);
    setEditCompany(item.company);
    setEditRole(item.role);
    setEditAppliedOn(item.applied_on);
    setEditStage(normalizeStage(item.stage));
    setEditRound(item.round ?? "");
    setEditReason(item.reason ?? item.rejection_reason ?? "");
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !editCompany.trim() || !editRole.trim()) return;

    await table.update(editingItem.id, {
      company: editCompany.trim().slice(0, 100),
      role: editRole.trim().slice(0, 100),
      stage: editStage,
      applied_on: editAppliedOn || editingItem.applied_on,
      round:
        editStage === "Selected" || editStage === "Interview" ? editRound.trim() || null : null,
      reason: editStage === "Rejected" ? editReason.trim() || null : null,
      rejection_reason: editStage === "Rejected" ? editReason.trim() || null : null,
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

    await table.update(id, { stage: newStage } as never);
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
        eyebrow="Career Execution Pipeline"
        title="Job Applications"
        description="One deliberate, high-quality application every day. Track stages, round progressions, and rejection insights."
      />

      {/* Target Status Banner */}
      <section
        className={`mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4 transition-all duration-300 ${
          todayCount
            ? "border-success/40 bg-success/5 shadow-success/20"
            : "border-primary/40 bg-primary/10"
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-lg border ${
              todayCount
                ? "border-success/50 bg-success/15 text-success"
                : "border-primary/50 bg-primary/20 text-primary"
            }`}
          >
            {todayCount ? (
              <CheckCircle2 className="size-5" />
            ) : (
              <BriefcaseBusiness className="size-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">
                {todayCount
                  ? `${todayCount} application${todayCount > 1 ? "s" : ""} logged today`
                  : "No application logged today"}
              </h2>
              {todayCount > 0 && (
                <span className="rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-semibold text-success">
                  Target Met
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Daily quota: 1 tailored application to sustain relentless momentum.
            </p>
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

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
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

          <div>
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

          <div>
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

          <div>
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
                  {s === "Selected" ? "Selected (Offer)" : s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Section: If Selected or Interview -> Which round */}
        {(stage === "Selected" || stage === "Interview" || formExpanded) && (
          <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-3.5 animate-fade-in-up">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-semibold text-primary">
                {stage === "Selected"
                  ? "🏆 Selected — Which round was cleared / offer received?"
                  : "🎯 Interview — Which round are you in?"}
              </label>
              {stage !== "Selected" && stage !== "Interview" && (
                <button
                  type="button"
                  onClick={() => setFormExpanded(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {ROUND_SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setRound(sug)}
                  className={`rounded-md border px-2 py-1 text-[11px] transition-colors ${
                    round === sug
                      ? "border-primary bg-primary text-primary-foreground font-medium"
                      : "border-border bg-card/60 text-muted-foreground hover:border-primary/50 hover:text-foreground"
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

        {/* Dynamic Section: If Rejected -> Why add reason */}
        {stage === "Rejected" && (
          <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/5 p-3.5 animate-fade-in-up">
            <div className="flex items-center gap-1.5">
              <XCircle className="size-4 text-rose-500" />
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
          <div className="flex items-center gap-2">
            {!formExpanded && stage !== "Selected" && stage !== "Interview" && (
              <button
                type="button"
                onClick={() => setFormExpanded(true)}
                className="text-[11px] text-muted-foreground underline-offset-4 hover:underline"
              >
                + Add round details or notes
              </button>
            )}
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {PIPELINE_STAGES.map((column) => {
          const cfg = stageConfig[column];
          const Icon = cfg.icon;
          const items = filteredRows.filter((r) => normalizeStage(r.stage) === column);

          return (
            <section
              key={column}
              className={`glass-panel flex min-h-64 flex-col rounded-xl border border-border p-3.5 transition-all ${
                column === "Selected" ? "border-emerald-500/25 bg-emerald-500/[0.02]" : ""
              }`}
            >
              {/* Column Header */}
              <div className="mb-3 flex items-center justify-between pb-2 border-b border-border/70">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex size-6 items-center justify-center rounded-md ${cfg.headerBg}`}
                  >
                    <Icon className="size-3.5 text-foreground" />
                  </div>
                  <h3 className="font-display text-xs font-semibold">{cfg.label}</h3>
                </div>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {items.length}
                </span>
              </div>

              {/* Items List */}
              {items.length > 0 ? (
                <div className="space-y-2.5 flex-1">
                  {items.map((r) => {
                    const stageNorm = normalizeStage(r.stage);
                    const itemReason = r.reason ?? r.rejection_reason;

                    return (
                      <article
                        key={r.id}
                        className={`group relative rounded-lg border bg-card p-3 shadow-xs transition-all hover:shadow-md ${
                          stageNorm === "Selected"
                            ? "border-emerald-500/40 bg-gradient-to-b from-card to-emerald-500/[0.03]"
                            : stageNorm === "Rejected"
                              ? "border-rose-500/30"
                              : "border-border hover:border-primary/50"
                        }`}
                      >
                        {/* Header: Role & Actions */}
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold leading-snug text-foreground">
                            {r.role}
                          </p>
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => openEditModal(r)}
                              title="Edit application"
                              aria-label="Edit application"
                              className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                            >
                              <Edit3 className="size-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void table.remove(r.id)}
                              title="Delete application"
                              aria-label="Delete application"
                              className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </div>
                        </div>

                        {/* Company & Date */}
                        <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="font-medium text-foreground/90">{r.company}</span>
                          <span className="flex items-center gap-1 text-[10px]">
                            <Calendar className="size-3" />
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
                            <span className="font-medium">🎯 {r.round}</span>
                          </div>
                        )}

                        {/* If Rejected: Display Rejection Reason */}
                        {stageNorm === "Rejected" && itemReason && (
                          <div className="mt-2 rounded-md border border-rose-500/25 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-600 dark:text-rose-400">
                            <span className="font-semibold">Reason:</span>{" "}
                            <span className="italic">{itemReason}</span>
                          </div>
                        )}

                        {/* Stage Switcher */}
                        <div className="mt-2.5 flex items-center justify-between gap-1 border-t border-border/50 pt-2">
                          <span className="text-[10px] text-muted-foreground">Stage:</span>
                          <select
                            value={stageNorm}
                            onChange={(e) =>
                              void handleStageChange(r.id, e.target.value as PipelineStage)
                            }
                            className="h-6 rounded border border-input bg-background/90 px-1.5 text-[10px] font-medium text-foreground focus:outline-none"
                          >
                            {PIPELINE_STAGES.map((s) => (
                              <option key={s} value={s}>
                                {s === "Selected" ? "Selected (Offer)" : s}
                              </option>
                            ))}
                          </select>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-muted-foreground">
                  <div className="rounded-full bg-secondary/50 p-2 text-muted-foreground/60 mb-1">
                    <Icon className="size-4" />
                  </div>
                  <p className="text-[11px]">No applications</p>
                </div>
              )}
            </section>
          );
        })}
      </div>

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
                      {s === "Selected" ? "Selected (Offer)" : s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Which Round if Selected or Interview */}
            {(editStage === "Selected" || editStage === "Interview") && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                <label className="block text-xs font-semibold text-primary mb-1">
                  {editStage === "Selected"
                    ? "🏆 Which round was selected / offer cleared?"
                    : "🎯 Which round?"}
                </label>
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

            {/* Reason if Rejected */}
            {editStage === "Rejected" && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
                <label className="block text-xs font-semibold text-rose-600 dark:text-rose-400 mb-1">
                  ⚠️ Why was it rejected? (Reason / Feedback)
                </label>
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
