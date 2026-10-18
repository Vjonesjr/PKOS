import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { CornerDownRight, Clock, Calendar } from "lucide-react";

/** One parsed todo: include toggle, inline-editable title and next action, read-only extras. */
export default function ParsedItem({ item, onChange }) {
  const set = (patch) => onChange({ ...item, ...patch });
  return (
    <div className="space-y-1.5 rounded-lg border border-border p-2">
      <div className="flex items-center gap-2">
        <Checkbox checked={item.include} onCheckedChange={(v) => set({ include: !!v })} aria-label="Include item" />
        <Input value={item.title} onChange={(e) => set({ title: e.target.value })} className={`h-8 ${item.done ? "line-through text-muted-foreground" : ""}`} aria-label="Task title" />
      </div>
      {!item.done && (
        <div className="flex items-center gap-1.5 pl-6">
          <CornerDownRight className="h-3.5 w-3.5 shrink-0 text-primary" />
          <Input value={item.next_action} onChange={(e) => set({ next_action: e.target.value })} placeholder="Next action" className="h-7 text-xs" aria-label="Next action" />
        </div>
      )}
      <div className="flex flex-wrap gap-1.5 pl-6 text-[11px] text-muted-foreground">
        {item.due_date && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{item.due_date}{item.time && ` ${item.time}`}</span>}
        {item.estimate_minutes > 0 && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{item.estimate_minutes}m</span>}
        {item.priority === "high" && <span className="text-destructive">high</span>}
        {item.tags.map((t) => <span key={t} className="text-primary">#{t}</span>)}
      </div>
      {[["Subtasks", item.subtasks], ["Focus chunks", item.chunks]].map(([label, list]) => list.length > 0 && (
        <div key={label} className="pl-6 text-xs">
          <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
          <ul className="list-disc pl-4 text-foreground">{list.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
      ))}
    </div>
  );
}