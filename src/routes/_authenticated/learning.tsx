import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Clock3, Plus, Trash2, TrendingUp } from "lucide-react";
import { useState } from "react";
import { PageHeading } from "@/components/page-heading";
import { TrackerShell } from "@/components/tracker-shell";
import { Button } from "@/components/ui/button";
import { todayKey, useLiveTable } from "@/lib/live-table";

export const Route = createFileRoute("/_authenticated/learning")({
  head: () => ({ meta: [
    { title: "Learning Tracker — Prove It" }, { name: "description", content: "Track DSA, system design, VQAR, and domain learning hours." },
    { property: "og:title", content: "Learning Tracker" }, { property: "og:description", content: "A focused view of learning hours, topics, and progress." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ]}), component: LearningPage,
});

const TRACKS = ["DSA", "System Design", "VQAR", "Domain Learning"] as const;
const MONTH_TARGET: Record<string, number> = { DSA: 60, "System Design": 60, VQAR: 60, "Domain Learning": 30 };
const field = "h-9 rounded-md border border-input bg-background/60 px-3 text-xs";

function LearningPage() {
  const s = useLiveTable("learning_sessions", "log_date");
  const [track, setTrack] = useState<(typeof TRACKS)[number]>("DSA");
  const [topic, setTopic] = useState(""); const [hours, setHours] = useState("2");
  const month = todayKey().slice(0, 7);
  const monthRows = s.rows.filter((r) => r.log_date.startsWith(month));
  const monthHours = monthRows.reduce((a, r) => a + Number(r.hours), 0);
  const weeks = new Map<string, number>();
  s.rows.forEach((r) => { const d = new Date(`${r.log_date}T00:00:00`); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); const k = d.toDateString(); weeks.set(k, (weeks.get(k) ?? 0) + Number(r.hours)); });
  const best = Math.max(0, ...weeks.values());
  const add = async () => { const h = Number(hours); if (!topic.trim() || !(h > 0 && h <= 24)) return; if (await s.insert({ track, topic: topic.trim().slice(0, 120), hours: h, log_date: todayKey() })) setTopic(""); };

  return <TrackerShell><PageHeading eyebrow="Knowledge system" title="Learning tracker" description="Every focused hour compounds. Capture the topic and time spent." />
    <div className="mb-6 grid gap-4 sm:grid-cols-3"><Stat icon={Clock3} label="This month" value={`${monthHours} hours`}/><Stat icon={BookOpen} label="Topics logged" value={String(s.rows.length)}/><Stat icon={TrendingUp} label="Best week" value={`${best} hours`}/></div>
    <section className="glass-panel mb-6 flex flex-wrap gap-2 rounded-xl p-4">
      <select value={track} onChange={(e) => setTrack(e.target.value as typeof track)} className={field}>{TRACKS.map((t) => <option key={t}>{t}</option>)}</select>
      <input value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={120} placeholder="Topic studied" className={`${field} min-w-40 flex-1`} />
      <input value={hours} onChange={(e) => setHours(e.target.value)} type="number" min="0.5" max="24" step="0.5" className={`${field} w-20`} aria-label="Hours" />
      <Button type="button" variant="command" size="sm" onClick={add}><Plus className="size-4"/>Log session</Button>
      {s.error && <p className="w-full text-[10px] text-destructive">{s.error}</p>}
    </section>
    <section className="glass-panel mb-6 rounded-xl p-5"><div className="grid gap-4 md:grid-cols-2">{TRACKS.map((t) => { const rows = monthRows.filter((r) => r.track === t); const h = rows.reduce((a, r) => a + Number(r.hours), 0); const pct = Math.min(100, Math.round((h / MONTH_TARGET[t]!) * 100)); return <article key={t} className="rounded-lg border border-border bg-card p-4"><div className="flex justify-between"><h2 className="font-display text-sm font-semibold">{t}</h2><span className="text-xs font-semibold">{h}h <span className="text-muted-foreground">/ {MONTH_TARGET[t]}h</span></span></div><p className="mt-1 text-[11px] text-muted-foreground">Latest · {rows[0]?.topic ?? "No topic yet"}</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-primary transition-[width] duration-700" style={{ width: `${pct}%` }}/></div><p className="mt-1 text-right text-[10px] text-muted-foreground">{pct}% of monthly target</p></article>; })}</div></section>
    <section className="glass-panel rounded-xl p-5"><h2 className="mb-3 text-sm font-semibold">Recent sessions</h2>{s.rows.length ? <ul className="divide-y divide-border">{s.rows.slice(0, 20).map((r) => <li key={r.id} className="flex items-center gap-3 py-2 text-xs"><span className="w-20 text-muted-foreground">{r.log_date}</span><span className="w-28 font-semibold">{r.track}</span><span className="flex-1">{r.topic}</span><span>{Number(r.hours)}h</span><button type="button" onClick={() => void s.remove(r.id)} aria-label="Delete session" className="text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5"/></button></li>)}</ul> : <p className="text-xs text-muted-foreground">No sessions logged yet.</p>}</section>
  </TrackerShell>;
}
function Stat({icon:Icon,label,value}:{icon:typeof Clock3;label:string;value:string}) { return <div className="glass-panel flex items-center gap-4 rounded-xl p-5"><span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground"><Icon className="size-5"/></span><div><p className="text-xs text-muted-foreground">{label}</p><p className="font-display text-lg font-semibold">{value}</p></div></div> }
