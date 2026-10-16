import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// One item per line, edited as plain text.
const LinesField = ({ label, value, onChange }) => (
  <div className="space-y-1">
    <p className="text-xs font-medium text-muted-foreground">{label} <span className="font-normal">(one per line)</span></p>
    <Textarea rows={Math.max(2, value.length)} value={value.join("\n")} onChange={(e) => onChange(e.target.value.split("\n"))} />
  </div>
);
const clean = (list) => list.map((s) => s.trim()).filter(Boolean);

/** Editable extra fields of an AI goal draft. */
export default function GoalDraftDetails({ goal, setGoal }) {
  const set = (patch) => setGoal({ ...goal, ...patch });
  return (
    <div className="space-y-3">
      <Textarea rows={2} value={goal.outcome} placeholder="Desired outcome" onChange={(e) => set({ outcome: e.target.value })} />
      <div className="grid grid-cols-2 gap-2">
        <Select value={goal.priority} onValueChange={(v) => set({ priority: v })}>
          <SelectTrigger aria-label="Priority"><SelectValue /></SelectTrigger>
          <SelectContent>{["low", "medium", "high"].map((p) => <SelectItem key={p} value={p}>{p[0].toUpperCase() + p.slice(1)} priority</SelectItem>)}</SelectContent>
        </Select>
        <Input value={goal.next_action} placeholder="First next action" onChange={(e) => set({ next_action: e.target.value })} aria-label="First next action" />
      </div>
      <LinesField label="Success criteria" value={goal.success_criteria} onChange={(v) => set({ success_criteria: v })} />
      <LinesField label="Milestones" value={goal.milestones.map((m) => m.title)} onChange={(v) => set({ milestones: v.map((title, i) => ({ ...goal.milestones[i], title, done: false })) })} />
      <LinesField label="Possible blockers" value={goal.blockers} onChange={(v) => set({ blockers: v })} />
    </div>
  );
}

/** Strip blank lines before saving. */
export const finalizeGoal = (g) => ({
  ...g,
  success_criteria: clean(g.success_criteria),
  blockers: clean(g.blockers),
  milestones: g.milestones.filter((m) => m.title?.trim()).map((m) => ({ title: m.title.trim(), done: false, due_date: m.due_date || "" })),
});