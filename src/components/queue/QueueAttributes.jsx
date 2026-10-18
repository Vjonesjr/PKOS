import React from "react";
import { Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EFFORTS, CONTEXTS } from "@/lib/taskQueue";

const chip = (on) => `rounded-full border px-2 py-0.5 text-[11px] ${on ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"}`;

/** Inline editor for effort, fun, contexts and due date. onSave(patch) persists. */
export default function QueueAttributes({ task, onSave }) {
  const ctx = task.contexts || [];
  return (
    <div className="space-y-2 px-1 pb-1 pt-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="w-12 text-[11px] text-muted-foreground">Effort</span>
        {EFFORTS.map(([v, l]) => <button key={v} type="button" className={chip(task.effort === v)} onClick={() => onSave({ effort: task.effort === v ? null : v })}>{l}</button>)}
      </div>
      <div className="flex items-center gap-1">
        <span className="w-12 text-[11px] text-muted-foreground">Fun</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" aria-label={`Fun ${n} of 5`} onClick={() => onSave({ fun: task.fun === n ? null : n })}>
            <Star className={`h-4 w-4 ${n <= (task.fun || 0) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="w-12 text-[11px] text-muted-foreground">Where</span>
        {CONTEXTS.map(([v, l]) => (
          <button key={v} type="button" className={chip(ctx.includes(v))} onClick={() => onSave({ contexts: ctx.includes(v) ? ctx.filter((c) => c !== v) : [...ctx, v] })}>{l}</button>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-12 text-[11px] text-muted-foreground">Due</span>
        <Input type="date" value={task.due_date || ""} onChange={(e) => onSave({ due_date: e.target.value || null })} className="h-8 w-40 text-xs" aria-label="Due date" />
      </div>
    </div>
  );
}