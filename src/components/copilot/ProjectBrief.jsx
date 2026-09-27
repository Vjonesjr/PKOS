import React from "react";
import { AlertTriangle } from "lucide-react";

const LISTS = [
  ["blockers", "Blockers"],
  ["unfinished_work", "Unfinished Work"],
  ["recent_progress", "Recent Progress"],
  ["relevant_knowledge", "Relevant Knowledge"],
  ["open_decisions", "Open Decisions"],
  ["risks_questions", "Risks / Questions"],
];

export default function ProjectBrief({ brief }) {
  return (
    <div className="space-y-4">
      {brief.signals?.length > 0 && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
          <p className="flex items-center gap-1.5 text-sm font-medium text-amber-300">
            <AlertTriangle className="h-4 w-4" /> This project may need attention
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{brief.signals.join(" · ")}</p>
        </div>
      )}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current State</p>
        <p className="mt-1 text-sm text-foreground/85">{brief.current_state}</p>
      </div>
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Next Best Action</p>
        <p className="mt-1 text-sm text-foreground/90">{brief.next_best_action}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {LISTS.map(([key, label]) => (
          <div key={key}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            {brief[key]?.length ? (
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-foreground/80">
                {brief[key].map((x, i) => <li key={i}>{x}</li>)}
              </ul>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">None found.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}