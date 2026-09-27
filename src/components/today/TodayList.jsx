import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import StatusBadge from "@/components/shared/StatusBadge";

export default function TodayList({ tasks, onToggle, onRemove }) {
  return (
    <div className="rounded-2xl border border-primary/30 bg-card/60 p-5">
      <p className="mb-3 text-sm font-semibold text-foreground/90">My Today List</p>
      {tasks.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nothing added yet. Use “Add to Today” on any suggestion.</p>
      ) : (
        <div className="space-y-1.5">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-secondary/40">
              <Checkbox checked={t.status === "done"} onCheckedChange={() => onToggle(t)} aria-label="Mark done" />
              <span className={`flex-1 text-sm ${t.status === "done" ? "text-muted-foreground line-through" : "text-foreground/90"}`}>{t.title}</span>
              <StatusBadge value={t.priority} />
              <button onClick={() => onRemove(t)} className="text-xs text-muted-foreground hover:text-foreground">Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}