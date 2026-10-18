import React from "react";
import { Link } from "react-router-dom";

/** Simple titled list; items: { key, label, meta?, to? }. */
export default function WeekList({ title, items, empty }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title} ({items.length})</p>
      {!items.length ? <p className="text-sm text-muted-foreground">{empty}</p> : (
        <ul className="max-h-72 space-y-1 overflow-y-auto">
          {items.map((i) => {
            const body = (
              <>
                <span className="min-w-0 truncate text-sm text-foreground/90">{i.label}</span>
                {i.meta && <span className="shrink-0 text-xs text-muted-foreground">{i.meta}</span>}
              </>
            );
            return (
              <li key={i.key}>
                {i.to
                  ? <Link to={i.to} className="flex justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-secondary/60">{body}</Link>
                  : <div className="flex justify-between gap-2 px-2 py-1.5">{body}</div>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}