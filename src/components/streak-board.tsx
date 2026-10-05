import { Award, BookOpen, Briefcase, Dumbbell, Flame, FolderGit2, PartyPopper, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MILESTONES, dayKey, trackStats, type Celebration, type Log, type TrackKey } from "@/lib/streaks";

const icons: Record<TrackKey, typeof Dumbbell> = { gym: Dumbbell, study: BookOpen, project: FolderGit2, application: Briefcase };

export function StreakBoard({ logs, onApplication }: { logs: Log[]; onApplication?: (on: boolean) => void }) {
  const stats = trackStats(logs);
  const appliedToday = logs.some((l) => l.category === "application" && l.log_date === dayKey());
  return (
    <section className="glass-panel rounded-xl p-5 md:p-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Streaks & milestones</h2>
          <p className="mt-1 text-xs text-muted-foreground">Badges unlock at {MILESTONES.join(", ")} days in a row.</p>
        </div>
        {onApplication && (
          <Button type="button" size="sm" variant={appliedToday ? "default" : "outline"} onClick={() => onApplication(!appliedToday)}>
            <Send className="size-3.5" />{appliedToday ? "Applied today" : "Mark today's application"}
          </Button>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((t) => {
          const Icon = icons[t.key];
          const next = MILESTONES.find((m) => m > t.current);
          return (
            <div key={t.key} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-semibold"><Icon className="size-4" />{t.label}</span>
                <span className={`flex items-center gap-1 text-sm font-bold ${t.current ? "text-warning streak-flame" : "text-muted-foreground"}`}><Flame className="size-4" />{t.current}</span>
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">Best {t.best}-day streak · {t.total} day{t.total === 1 ? "" : "s"} logged</p>
              {next && <div className="mt-2 h-1 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${(t.current / next) * 100}%` }} /></div>}
              {t.best >= MILESTONES[0]! ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {MILESTONES.filter((m) => t.best >= m).map((m) => (
                    <span key={m} title={`${m}-day badge earned`} className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                      <Award className="size-3" />{m}d
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-[10px] text-muted-foreground">First badge unlocks at {MILESTONES[0]} days in a row.</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function CelebrationOverlay({ celebration, onClose }: { celebration: Celebration; onClose: () => void }) {
  if (!celebration) return null;
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-foreground/40 p-4 animate-fade-in" role="dialog" aria-label="Milestone reached" onClick={onClose}>
      <div className="relative overflow-hidden rounded-xl bg-card p-8 text-center shadow-2xl success-pop" onClick={(e) => e.stopPropagation()}>
        {Array.from({ length: 18 }, (_, i) => (
          <span key={i} className="confetti-bit absolute top-0 size-2 rounded-sm bg-primary" style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 6) * 0.12}s`, opacity: i % 2 ? 0.6 : 1 }} />
        ))}
        <span className="success-pop mx-auto grid size-16 place-items-center rounded-full bg-primary text-primary-foreground"><PartyPopper className="size-8" /></span>
        <p className="mt-4 text-[10px] font-bold uppercase text-muted-foreground">New milestone</p>
        <h2 className="mt-1 font-display text-2xl font-bold">{celebration.milestone}-day streak!</h2>
        <p className="mt-2 text-sm text-muted-foreground">{celebration.track} — you proved it. Keep going.</p>
        <Button type="button" className="mt-5" onClick={onClose}>Let's go</Button>
      </div>
    </div>
  );
}
