import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, FolderKanban, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { PageHeading } from "@/components/page-heading";
import { TrackerShell } from "@/components/tracker-shell";
import { Button } from "@/components/ui/button";
import { useLiveTable } from "@/lib/live-table";

export const Route = createFileRoute("/_authenticated/projects")({ head:()=>({meta:[{title:"Projects — Prove It"},{name:"description",content:"Track active, completed, and live final-year projects."},{property:"og:title",content:"Project Tracker"},{property:"og:description",content:"Build, finish, and ship meaningful student projects."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}), component: ProjectsPage });

const STATUSES = ["planning", "building", "completed", "live"] as const;
const field = "h-9 rounded-md border border-input bg-background/60 px-3 text-xs";

function ProjectsPage() {
  const p = useLiveTable("projects");
  const [name, setName] = useState(""); const [description, setDescription] = useState(""); const [link, setLink] = useState("");
  const add = async () => {
    if (!name.trim()) return;
    const url = link.trim(); if (url && !/^https?:\/\//i.test(url)) return;
    if (await p.insert({ name: name.trim().slice(0, 100), description: description.trim().slice(0, 300) || null, link: url || null })) { setName(""); setDescription(""); setLink(""); }
  };
  return <TrackerShell><PageHeading eyebrow="Ship your work" title="Project portfolio" description="Move every idea from planning to production, with a clear record of what is completed and live."/>
    <section className="glass-panel mb-6 flex flex-wrap gap-2 rounded-xl p-4">
      <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="Project name" className={`${field} w-44`} />
      <input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} placeholder="Short description" className={`${field} min-w-40 flex-1`} />
      <input value={link} onChange={(e) => setLink(e.target.value)} maxLength={300} placeholder="https://live-link (optional)" className={`${field} w-52`} />
      <Button type="button" variant="command" size="sm" onClick={add}><Plus className="size-4"/>Add project</Button>
      {p.error && <p className="w-full text-[10px] text-destructive">{p.error}</p>}
    </section>
    {p.rows.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{STATUSES.map((st) => { const items = p.rows.filter((r) => r.status === st); return <section key={st} className="glass-panel min-h-48 rounded-xl p-4"><div className="mb-3 flex justify-between"><h2 className="font-display text-sm font-semibold capitalize">{st}</h2><span className="rounded-full bg-secondary px-2 py-0.5 text-[10px]">{items.length}</span></div><div className="space-y-2">{items.map((r) => <article key={r.id} className="rounded-lg border border-border bg-card p-3"><div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold">{r.name}</p><button type="button" onClick={() => void p.remove(r.id)} aria-label="Delete project" className="text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5"/></button></div>{r.description && <p className="mt-1 text-[11px] text-muted-foreground">{r.description}</p>}{r.link && <a href={r.link} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-success">Open <ExternalLink className="size-3"/></a>}<select value={r.status} onChange={(e) => void p.update(r.id, { status: e.target.value })} className="mt-2 h-7 w-full rounded border border-input bg-background px-2 text-[11px] capitalize">{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></article>)}</div></section>; })}</div>
    : <section className="glass-panel flex min-h-60 flex-col items-center justify-center rounded-xl p-8 text-center"><FolderKanban className="size-9"/><h2 className="mt-4 font-display text-lg font-semibold">No projects added yet</h2><p className="mt-2 text-xs text-muted-foreground">Add your first project above.</p></section>}
  </TrackerShell>;
}
