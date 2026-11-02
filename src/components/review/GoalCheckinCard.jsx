import React, { useState } from "react";
import { Loader2, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { goalProgress } from "@/lib/goals";
import useGoalActivity from "@/hooks/useGoalActivity";
import { CHECKIN_STATUSES, statusMeta } from "@/lib/weeks";

/** Pace: share of the goal's time elapsed, for an "expected vs actual" hint. */
const pace = (g) => {
  if (!g.target_date) return null;
  const start = new Date(g.created_date).getTime(), end = new Date(g.target_date).getTime();
  return end > start ? Math.round(Math.min(1, Math.max(0, (Date.now() - start) / (end - start))) * 100) : null;
};

export default function GoalCheckinCard({ goal, week, workspace, projects, history, onSaved }) {
  const current = history.find((c) => c.week_start === week);
  const last = history.find((c) => c.week_start < week);
  const [status, setStatus] = useState(current?.status || "");
  const [note, setNote] = useState(current?.note || "");
  const [krs, setKrs] = useState(goal.key_results || []);
  const [manual, setManual] = useState(goal.manual_progress || 0);
  const [saving, setSaving] = useState(false);

  const live = { ...goal, key_results: krs, manual_progress: Number(manual) };
  const activity = useGoalActivity(goal, projects);
  const progress = goalProgress(live, projects, activity);
  const delta = last ? progress - (last.progress_snapshot || 0) : null;
  const expected = pace(goal);

  const save = async () => {
    setSaving(true);
    if (goal.progress_mode === "key_results") await base44.entities.Goal.update(goal.id, { key_results: krs });
    if (goal.progress_mode === "manual") await base44.entities.Goal.update(goal.id, { manual_progress: Number(manual) });
    await base44.entities.GoalCheckin.upsert([{
      goal_id: goal.id, week_start: week, status, note, workspace, progress_snapshot: progress,
      kr_snapshot: krs.map(({ title, current, target }) => ({ title, current, target })),
    }], { key: ["goal_id", "week_start"] });
    setSaving(false);
    onSaved();
  };

  return (
    <div className={`space-y-2.5 rounded-lg border p-3 ${current ? "border-primary/30" : "border-border"}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-sm font-medium text-foreground break-words">{goal.title}</p>
        {current && <Check className="h-4 w-4 shrink-0 text-primary" aria-label="Checked in" />}
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{progress}%{delta !== null && <span className={delta >= 0 ? " text-emerald-400" : " text-red-400"}> {delta >= 0 ? "+" : ""}{delta}</span>}</span>
          {expected !== null && <span>expected ~{expected}%</span>}
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>
      {last && <p className="text-[11px] text-muted-foreground">Last: {statusMeta(last.status)?.label}{last.note ? ` · “${last.note}”` : ""}</p>}
      <div className="grid grid-cols-3 gap-1">
        {CHECKIN_STATUSES.map((s) => (
          <button key={s.value} onClick={() => setStatus(s.value)} aria-pressed={status === s.value}
            className={`rounded-md border px-1 py-1.5 text-xs font-medium ${status === s.value ? s.cls : "border-border text-muted-foreground"} ${!status && last?.status === s.value ? "border-dashed" : ""}`}>{s.label}</button>
        ))}
      </div>
      {goal.progress_mode === "key_results" && krs.map((k, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="min-w-0 flex-1 truncate text-foreground/80">{k.title}</span>
          <Input type="number" className="h-7 w-20" value={k.current ?? 0} aria-label={`${k.title} current`}
            onChange={(e) => setKrs(krs.map((x, j) => (j === i ? { ...x, current: Number(e.target.value) } : x)))} />
          <span className="shrink-0 text-muted-foreground">/ {k.target} {k.unit}</span>
        </div>
      ))}
      {goal.progress_mode === "manual" && <Input type="number" min={0} max={100} className="h-8" value={manual} onChange={(e) => setManual(e.target.value)} aria-label="Progress percent" />}
      <Input className="h-8" maxLength={300} placeholder="What moved, or what's blocking?" value={note} onChange={(e) => setNote(e.target.value)} />
      <Button size="sm" className="w-full gap-1.5" disabled={!status || saving} onClick={save}>
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} {current ? "Update check-in" : "Save check-in"}
      </Button>
    </div>
  );
}