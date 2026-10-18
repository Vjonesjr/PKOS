import React from "react";

/** One-glance view: top 3 next actions, overdue and today counts. */
export default function ParseSummary({ items, today }) {
  const open = items.filter((i) => i.include && !i.done);
  const top = open.filter((i) => i.next_action).sort((a, b) => (b.priority === "high") - (a.priority === "high")).slice(0, 3);
  const overdue = open.filter((i) => i.due_date && i.due_date < today).length;
  const dueToday = open.filter((i) => i.due_date === today).length;
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">Start here</p>
      {top.length ? <ol className="list-decimal space-y-0.5 pl-5 text-foreground">{top.map((i, k) => <li key={k}>{i.next_action} <span className="text-muted-foreground">· {i.title}</span></li>)}</ol>
        : <p className="text-muted-foreground">No open next actions.</p>}
      <p className="mt-2 text-xs text-muted-foreground">{open.length} open · {dueToday} due today · {overdue} overdue</p>
    </div>
  );
}