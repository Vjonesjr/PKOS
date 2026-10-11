import React from "react";
import { Link } from "react-router-dom";
import { Pencil, FolderKanban, Repeat, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { goalProgress } from "@/lib/goals";

const STATUS_STYLES = {
  Active: "bg-primary/15 text-primary",
  Achieved: "bg-emerald-500/15 text-emerald-400",
  Paused: "bg-amber-500/15 text-amber-400",
  Dropped: "bg-muted text-muted-foreground",
  Draft: "bg-secondary text-muted-foreground",
};

import CheckinChart from "@/components/goals/CheckinChart";

export default function GoalCard({ goal, projects, checkins = [], habitCount, onEdit }) {
  const progress = goalProgress(goal, projects);
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{goal.area}</p>
          <p className="font-medium text-foreground break-words">{goal.title}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[goal.status] || STATUS_STYLES.Draft}`}>{goal.status}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit} aria-label="Edit goal"><Pencil className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
      {goal.why && <p className="text-xs text-muted-foreground line-clamp-2">{goal.why}</p>}
      <div className="space-y-1">
        <div className="flex justify-between text-xs"><span className="text-muted-foreground">Progress</span><span className="text-foreground/90">{progress}%</span></div>
        <Progress value={progress} className="h-1.5" />
      </div>
      <CheckinChart checkins={checkins} />
      {goal.progress_mode === "key_results" && (goal.key_results || []).map((k, i) => (
        <p key={i} className="text-xs text-foreground/80">• {k.title}: {k.current || 0}/{k.target} {k.unit}</p>
      ))}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><FolderKanban className="h-3.5 w-3.5" /> {projects.length} projects</span>
        <Link to="/goals?tab=habits" className="flex items-center gap-1 hover:text-foreground"><Repeat className="h-3.5 w-3.5" /> {habitCount} habits</Link>
        {goal.target_date && <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {goal.target_date}</span>}
      </div>
      {projects.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {projects.map((p) => (
            <Link key={p.id} to={`/project-detail?id=${p.id}`} className="rounded-md bg-secondary px-2 py-0.5 text-[11px] text-foreground/80 hover:text-foreground">{p.title}</Link>
          ))}
        </div>
      )}
    </div>
  );
}