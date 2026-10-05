import { createFileRoute } from "@tanstack/react-router";
import { PageHeading } from "@/components/page-heading";
import { TrackerShell } from "@/components/tracker-shell";
import { CelebrationOverlay, StreakBoard } from "@/components/streak-board";
import { useActivity } from "@/lib/streaks";
export const Route=createFileRoute("/_authenticated/achievements")({head:()=>({meta:[{title:"Achievements — Prove It"},{name:"description",content:"Celebrate learning, project, streak, and hackathon milestones."},{property:"og:title",content:"Achievement Wall"},{property:"og:description",content:"A record of earned milestones and student wins."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),component:AchievementsPage});
function AchievementsPage(){const activity=useActivity();return <TrackerShell><PageHeading eyebrow="Proof of progress" title="Achievement wall" description="Keep the wins visible. Small milestones are evidence that the system is working."/><StreakBoard logs={activity.logs} onApplication={(on)=>void activity.toggle("application",on)}/><CelebrationOverlay celebration={activity.celebration} onClose={activity.dismiss}/></TrackerShell>}
