import React from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function MilestoneList({ items, onChange }) {
  const set = (i, patch) => onChange(items.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  return (
    <div className="space-y-1.5">
      {items.map((m, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <Input value={m.title} onChange={(e) => set(i, { title: e.target.value })} placeholder="Milestone" className="h-8 min-w-0 flex-1 text-xs" />
          <Input type="date" value={m.due_date} onChange={(e) => set(i, { due_date: e.target.value })} className="h-8 w-32 shrink-0 text-xs" aria-label="Milestone due date" />
          <button type="button" aria-label="Remove milestone" onClick={() => onChange(items.filter((_, j) => j !== i))} className="shrink-0 rounded p-1 text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, { title: "", due_date: "", done: false }])} className="flex items-center gap-1 text-xs text-primary"><Plus className="h-3 w-3" /> Add milestone</button>
    </div>
  );
}