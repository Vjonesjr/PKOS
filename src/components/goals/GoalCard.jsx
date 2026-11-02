import { celebrate } from "@/components/shared/Celebration";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, FolderKanban, Repeat, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import ProgressAdjuster from "@/components/shared/ProgressAdjuster";
import { actionSaved } from "@/lib/taskStatus";
import { goalProgress } from "@/lib/goals";
import useGoalActivity from "@/hooks/useGoalActivity";

const STATUS_STYLES = {
  Active: "bg-primary/15 text-primary",
  Achieved: "bg-emerald-500/15 text-emerald-400",
  Paused: "bg-amber-500/15 text-amber-400",
  Dropped: "bg-muted text-muted-foreground",
  Draft: "bg-secondary text-muted-foreground",
};

import CheckinChart from "@/components/goals/CheckinChart";

export default function GoalCard({ goal, projects, checkins = [], habitCount, onEdit, onProgress }) {
  const [updating, setUpdating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(goal.manual_progress ?? 0);
  const [progressError, setProgressError] = useState("");
  useEffect(() => setDraft(goal.manual_progress ?? 0), [goal.manual_progress]);
  const activity = useGoalActivity(goal, projects);
  const progress = goalProgress(goal, projects, activity);
  const saveProgress = async () => {
    const value = Number(draft);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      setProgressError("Enter a number from 0 to 100.");
      return;
    }
    setSaving(true);
    setProgressError("");
    try {
      await onProgress(value);
      actionSaved(`Progress saved: ${goal.title} · ${value}%`);
      if (value > progress && (value === 100 || Math.floor(value / 25) > Math.floor(progress / 25))) celebrate({ title: value === 100 ? "Goal complete!" : "Progress saved!", subtitle: goal.title, from: progress, progress: value });
      setUpdating(false);
    } catch (error) {
      setProgressError(error.message || "Could not save progress.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="rounded-2xl border border-primary/25 bg-card/40 pk-glass p-4 space-y-3">
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
        <div className="flex justify-between text-xs"><span className="text-muted-foreground">{updating ? "Progress preview" : "Progress"}</span><span className="text-foreground/90">{updating ? Math.max(0, Math.min(100, Number(draft) || 0)) : progress}%</span></div>
        <Progress value={updating ? Math.max(0, Math.min(100, Number(draft) || 0)) : progress} className="h-1.5" />
        {!updating && <Button type="button" variant="outline" size="sm" className="mt-2 min-h-10" onClick={() => { setDraft(progress); setUpdating(true); }}>Update progress</Button>}
        {updating && (
          <div className="space-y-3 pt-2">
            {goal.progress_mode !== "manual" && <p className="text-sm text-muted-foreground">Saving here switches this goal to manual progress. Use Edit goal to switch back to automatic tracking.</p>}
            <ProgressAdjuster value={draft} onChange={setDraft} disabled={saving} />
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" className="min-h-10" disabled={saving} onClick={saveProgress}>{saving ? "Saving..." : "Save progress"}</Button>
              <Button type="button" variant="ghost" size="sm" className="min-h-11" disabled={saving} onClick={() => { setUpdating(false); setDraft(goal.manual_progress ?? 0); setProgressError(""); }}>Cancel</Button>
            </div>
            {progressError && <p role="alert" className="mt-1 text-xs text-destructive">{progressError}</p>}
          </div>
        )}
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
