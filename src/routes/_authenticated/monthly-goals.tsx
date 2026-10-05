import { createFileRoute } from "@tanstack/react-router";
import { Minus, Plus, Target, Trash2 } from "lucide-react";
import { useState } from "react";
import { PageHeading } from "@/components/page-heading";
import { TrackerShell } from "@/components/tracker-shell";
import { Button } from "@/components/ui/button";
import { todayKey, useLiveTable } from "@/lib/live-table";
export const Route=createFileRoute("/_authenticated/monthly-goals")({head:()=>({meta:[{title:"Monthly Goals — Prove It"},{name:"description",content:"Turn final-year priorities into measurable monthly outcomes."},{property:"og:title",content:"Monthly Goals"},{property:"og:description",content:"Measure monthly learning, project, application, and fitness targets."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),component:MonthlyGoalsPage});
const field = "h-9 rounded-md border border-input bg-background/60 px-3 text-xs";

function MonthlyGoalsPage(){
  const g = useLiveTable("monthly_goals");
  const [title,setTitle]=useState(""); const [target,setTarget]=useState("30");
  const month = `${todayKey().slice(0,7)}-01`;
  const goals = g.rows.filter(r=>r.month===month);
  const pct = goals.length ? Math.round(goals.reduce((s,r)=>s+Math.min(100,(r.progress/r.target)*100),0)/goals.length) : 0;
  const add = async () => { const t=Number(target); if(!title.trim()||!(t>0&&t<=10000)) return; if(await g.insert({title:title.trim().slice(0,100),target:Math.round(t),month})) setTitle(""); };
  return <TrackerShell><PageHeading eyebrow="Monthly objectives" title="Monthly targets" description="Choose fewer goals, measure them honestly, and turn each one into daily action."/>
    <div className="grid gap-6 xl:grid-cols-12"><section className="glass-panel rounded-xl p-5 xl:col-span-8">
      <div className="mb-4 flex flex-wrap gap-2"><input value={title} onChange={e=>setTitle(e.target.value)} maxLength={100} placeholder="Target, e.g. Solve 60 DSA problems" className={`${field} min-w-40 flex-1`}/><input value={target} onChange={e=>setTarget(e.target.value)} type="number" min="1" max="10000" className={`${field} w-24`} aria-label="Target amount"/><Button type="button" variant="command" size="sm" onClick={add}><Plus className="size-4"/>Add target</Button></div>
      {g.error && <p className="mb-2 text-[10px] text-destructive">{g.error}</p>}
      {goals.length ? <ul className="space-y-3">{goals.map(r=>{const p=Math.min(100,Math.round((r.progress/r.target)*100));return <li key={r.id} className="rounded-lg border border-border bg-card p-3"><div className="flex items-center gap-2"><p className="flex-1 text-sm font-semibold">{r.title}</p><button type="button" aria-label="Decrease" onClick={()=>void g.update(r.id,{progress:Math.max(0,r.progress-1)})} className="rounded border border-border p-1"><Minus className="size-3"/></button><span className="w-16 text-center text-xs">{r.progress}/{r.target}</span><button type="button" aria-label="Increase" onClick={()=>void g.update(r.id,{progress:r.progress+1})} className="rounded border border-border p-1"><Plus className="size-3"/></button><button type="button" aria-label="Delete target" onClick={()=>void g.remove(r.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5"/></button></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary"><div className={`h-full transition-[width] duration-500 ${p===100?"bg-success":"bg-primary"}`} style={{width:`${p}%`}}/></div></li>})}</ul>
      : <div className="flex min-h-48 flex-col items-center justify-center text-center"><Target className="size-8"/><p className="mt-3 text-sm font-semibold">No monthly targets yet</p><p className="text-xs text-muted-foreground">Add your first measurable target above.</p></div>}
    </section><aside className="glass-panel rounded-xl p-6 xl:col-span-4"><Target className="size-7"/><p className="mt-5 text-xs font-semibold uppercase text-muted-foreground">Overall completion</p><p className="mt-1 font-display text-5xl font-semibold">{pct}%</p><div className="mt-7 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-primary transition-[width] duration-700" style={{width:`${pct}%`}}/></div><p className="mt-3 text-xs text-muted-foreground">{goals.length} target{goals.length===1?"":"s"} this month</p></aside></div></TrackerShell>}
