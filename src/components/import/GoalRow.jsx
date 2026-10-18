import React from "react";
import { Target } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GOAL_AREAS } from "@/lib/goals";
import MilestoneList from "@/components/import/MilestoneList";

export default function GoalRow({ goal, onChange, duplicate }) {
  const set = (patch) => onChange({ ...goal, ...patch });
  return (
    <div className={`space-y-2 rounded-xl border bg-card/60 p-3 ${goal.include ? "border-border" : "border-border/40 opacity-50"}`}>
      <div className="flex items-center gap-2">
        <Checkbox checked={goal.include} onCheckedChange={(v) => set({ include: !!v })} aria-label="Include goal" />
        <Target className="h-4 w-4 shrink-0 text-primary" />
        <Input value={goal.title} onChange={(e) => set({ title: e.target.value })} className="h-8 min-w-0 flex-1 text-sm" aria-label="Goal title" />
      </div>
      {duplicate && <p className="text-xs text-amber-500">A goal with this title already exists; it will be skipped and its projects linked to the existing goal.</p>}
      <div className="grid grid-cols-2 gap-2">
        <Select value={goal.area} onValueChange={(v) => set({ area: v })}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>{GOAL_AREAS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
        </Select>
        <Input type="date" value={goal.target_date} onChange={(e) => set({ target_date: e.target.value })} className="h-8 text-xs" aria-label="Target date" />
      </div>
      <MilestoneList items={goal.milestones} onChange={(milestones) => set({ milestones })} />
    </div>
  );
}