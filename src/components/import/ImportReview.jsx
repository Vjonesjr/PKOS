import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import GoalRow from "@/components/import/GoalRow";
import ProjectRow from "@/components/import/ProjectRow";

const lc = (t) => t.trim().toLowerCase();

export default function ImportReview({ plan, setPlan, existing, existingGoals, onConfirm, onCancel, saving }) {
  const update = (list, i, v) => setPlan({ ...plan, [list]: plan[list].map((x, j) => (j === i ? v : x)) });
  const goalOptions = [
    ...plan.goals.filter((g) => g.include && g.title.trim()).map((g) => ({ value: `new:${g.key}`, label: `${g.title} (new)` })),
    ...existingGoals.map((g) => ({ value: `id:${g.id}`, label: g.title })),
  ];
  const count = plan.goals.filter((g) => g.include).length + plan.projects.filter((p) => p.include).length;
  return (
    <div className="space-y-4">
      {plan.warnings.length > 0 && (
        <div className="space-y-1 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
          {plan.warnings.map((w, i) => <p key={i} className="flex gap-1.5 text-xs text-foreground/90"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />{w}</p>)}
        </div>
      )}
      {plan.goals.length > 0 && <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Goals ({plan.goals.length})</p>}
      {plan.goals.map((g, i) => <GoalRow key={g.key} goal={g} duplicate={existing?.goals.has(lc(g.title))} onChange={(v) => update("goals", i, v)} />)}
      {plan.projects.length > 0 && <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Projects ({plan.projects.length})</p>}
      {plan.projects.map((p, i) => <ProjectRow key={p.key} project={p} goalOptions={goalOptions} duplicate={existing?.projects.has(lc(p.title))} onChange={(v) => update("projects", i, v)} />)}
      <div className="sticky bottom-0 flex gap-2 border-t border-border bg-background/95 py-3 backdrop-blur">
        <Button variant="outline" onClick={onCancel} disabled={saving} className="flex-1">Cancel</Button>
        <Button onClick={onConfirm} disabled={saving || !count} className="flex-1">
          {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />} Import {count} record{count === 1 ? "" : "s"}
        </Button>
      </div>
    </div>
  );
}