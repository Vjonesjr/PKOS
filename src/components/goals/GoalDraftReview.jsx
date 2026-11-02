import React, { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import KeyResultsEditor from "@/components/goals/KeyResultsEditor";
import DraftChecklist from "@/components/goals/DraftChecklist";
import { applyGoalDraft } from "@/lib/goalDraftApply";
import GoalDraftDetails, { finalizeGoal } from "@/components/goals/GoalDraftDetails";

const toggle = (set, key) => { const n = new Set(set); n.has(key) ? n.delete(key) : n.add(key); return n; };

/** Editable review of an AI draft. Links default on; new records default off. */
export default function GoalDraftReview({ draft, workspace, onDone, onCancel }) {
  const { toast } = useToast();
  const [goal, setGoal] = useState(draft.goal);
  const [krs, setKrs] = useState(draft.key_results);
  const [picks, setPicks] = useState({
    linkProjects: new Set(draft.link_projects.map((p) => p.id)),
    linkHabits: new Set(draft.link_habits.map((h) => h.id)),
    newProjects: new Set(),
    newHabits: new Set(),
    newTasks: new Set(),
  });
  const [saving, setSaving] = useState(false);
  const flip = (k, v) => setPicks((p) => ({ ...p, [k]: toggle(p[k], v) }));

  const save = async () => {
    setSaving(true);
    const { goal: created, failed } = await applyGoalDraft({ ...draft, goal: finalizeGoal(goal), key_results: krs }, picks, workspace);
    setSaving(false);
    toast(failed.length ? { title: "Goal created", description: `Couldn't apply: ${failed.join(", ")}. Link them from the edit forms.`, variant: "destructive" } : { title: "Goal created" });
    onDone(created);
  };

  return (
    <div className="space-y-3 border-t border-border pt-3">
      <p className="inline-flex rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold tracking-widest text-primary">AI-GENERATED GOAL DRAFT</p>
      <p className="text-[11px] text-muted-foreground">Nothing is saved until you press Accept. Edit anything below.</p>
      {[...draft.overlaps.map((o) => `Similar to “${o.title}”: ${o.note}`), ...draft.warnings].map((w, i) => (
        <p key={i} className="flex gap-1.5 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{w}</p>
      ))}
      <Input value={goal.title} onChange={(e) => setGoal({ ...goal, title: e.target.value })} aria-label="Goal title" />
      <Textarea rows={2} value={goal.why} placeholder="Why it matters" onChange={(e) => setGoal({ ...goal, why: e.target.value })} />
      <div className="grid grid-cols-2 gap-2">
        <Input value={goal.area} readOnly aria-label="Area" />
        <Input type="date" value={goal.target_date} onChange={(e) => setGoal({ ...goal, target_date: e.target.value })} aria-label="Target date" />
      </div>
      <GoalDraftDetails goal={goal} setGoal={setGoal} />
      <KeyResultsEditor value={krs} onChange={setKrs} />
      <DraftChecklist title="Create suggested tasks" items={draft.suggested_tasks.map((t, i) => ({ key: i, label: t }))} selected={picks.newTasks} onToggle={(k) => flip("newTasks", k)} />
      <DraftChecklist title="Link existing projects" items={draft.link_projects.map((p) => ({ key: p.id, label: p.title, hint: p.reason }))} selected={picks.linkProjects} onToggle={(k) => flip("linkProjects", k)} />
      <DraftChecklist title="Link existing habits" items={draft.link_habits.map((h) => ({ key: h.id, label: h.title, hint: h.reason }))} selected={picks.linkHabits} onToggle={(k) => flip("linkHabits", k)} />
      <DraftChecklist title="Create new projects" items={draft.new_projects.map((p, i) => ({ key: i, label: p.title, hint: p.next_action }))} selected={picks.newProjects} onToggle={(k) => flip("newProjects", k)} />
      <DraftChecklist title="Create new habits" items={draft.new_habits.map((h, i) => ({ key: i, label: h.title, hint: h.schedule_type?.replace("_", " ") }))} selected={picks.newHabits} onToggle={(k) => flip("newHabits", k)} />
      <div className="flex gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={saving} className="flex-1">Cancel</Button>
        <Button onClick={save} disabled={saving || !goal.title.trim()} className="flex-1 gap-1.5">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Accept & save
        </Button>
      </div>
    </div>
  );
}