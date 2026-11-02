import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { CornerDownRight, Clock, Calendar, Anchor } from "lucide-react";

/** One parsed todo: include toggle, inline-editable title / next action / memory anchor. */
export default function ParsedItem({ item, onChange }) {
  const set = (patch) => onChange({ ...item, ...patch });
  return (
    <div className="space-y-1.5 rounded-lg border border-border p-2">
      <div className="flex items-center gap-2">
        <Checkbox checked={item.include} onCheckedChange={(v) => set({ include: !!v })} aria-label="Include item" />
        <Input value={item.title} onChange={(e) => set({ title: e.target.value })} className={`h-8 ${item.done ? "line-through text-muted-foreground" : ""}`} aria-label="Task title" />
      </div>
      {!item.done && (
        <>
          <div className="flex items-center gap-1.5 pl-6">
            <CornerDownRight className="h-3.5 w-3.5 shrink-0 text-primary" />
            <Input value={item.next_action} onChange={(e) => set({ next_action: e.target.value })} placeholder="Next action" className="h-7 text-xs" aria-label="Next action" />
          </div>
          <div className="flex items-center gap-1.5 pl-6">
            <Anchor className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <Input value={item.anchor || ""} onChange={(e) => set({ anchor: e.target.value })} placeholder="Memory anchor: where you left off, or a link" className="h-7 text-xs" aria-label="Memory anchor" />
          </div>
        </>
      )}
      <div className="flex flex-wrap gap-1.5 pl-6 text-[11px] text-muted-foreground">
        {item.due_date && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{item.due_date}{item.time && ` ${item.time}`}</span>}
        {item.estimate_minutes > 0 && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{item.estimate_minutes}m</span>}
        {item.priority === "high" && <span className="text-destructive">high</span>}
        {item.tags.map((t) => <span key={t} className="text-primary">#{t}</span>)}
      </div>
      {item.subtasks.length > 0 && (
        <ul className="space-y-0.5 pl-6 text-xs text-foreground">
          {item.subtasks.map((s, i) => <li key={i} className="flex justify-between gap-2"><span>· {s.title}</span>{s.minutes > 0 && <span className="text-muted-foreground">{s.minutes}m</span>}</li>)}
        </ul>
      )}
      {item.chunks.length > 0 && (
        <div className="pl-6 text-xs">
          <p className="text-[11px] font-medium text-muted-foreground">Focus chunks</p>
          <ul className="list-disc pl-4 text-foreground">{item.chunks.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
      )}
    </div>
  );
}