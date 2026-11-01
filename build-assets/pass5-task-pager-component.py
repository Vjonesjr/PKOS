"""Generate a safe, reusable task group pager for the restored PKOS app.

Presentational only. No task records are changed or deleted.
"""
from pathlib import Path

p = Path("app/src/components/tasks/TaskGroupPager.jsx")
assert not p.exists(), "TaskGroupPager already exists; inspect before replacing"
p.parent.mkdir(parents=True, exist_ok=True)
p.write_text(r"""import React, { useEffect, useState } from "react";

const PAGE_SIZE = 5;
const keyFor = (groupKey) => "pkos-task-group-expanded:" + groupKey;
function readExpanded(groupKey, fallback) {
  try {
    const value = localStorage.getItem(keyFor(groupKey));
    return value === null ? fallback : value === "true";
  } catch {
    return fallback;
  }
}

/** Display-only pagination. All tasks remain in storage and in the input array. */
export default function TaskGroupPager({
  groupKey,
  items = [],
  renderItem,
  defaultExpanded = true,
}) {
  const [expanded, setExpanded] = useState(() => readExpanded(groupKey, defaultExpanded));
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    setExpanded(readExpanded(groupKey, defaultExpanded));
  }, [groupKey, defaultExpanded]);

  const toggle = () => {
    setExpanded(value => {
      const next = !value;
      try { localStorage.setItem(keyFor(groupKey), String(next)); } catch {}
      return next;
    });
  };

  const shown = expanded ? items.slice(0, visibleCount) : [];
  const remaining = Math.max(0, items.length - visibleCount);

  return (
    <section aria-label={groupKey} className="min-w-0">
      <button type="button" aria-expanded={expanded} onClick={toggle}
        className="flex min-h-11 w-full items-center justify-between gap-2 px-3 py-2 text-left font-medium">
        <span>{groupKey} <span className="text-muted-foreground">({items.length})</span></span>
        <span aria-hidden="true">{expanded ? "−" : "+"}</span>
      </button>
      {expanded && (
        <div className="min-w-0">
          {shown.map(renderItem)}
          {remaining > 0 && (
            <button type="button" className="min-h-11 px-3 py-2 text-sm underline"
              onClick={() => setVisibleCount(n => n + PAGE_SIZE)}>
              Show {Math.min(PAGE_SIZE, remaining)} more
            </button>
          )}
          {visibleCount > PAGE_SIZE && (
            <button type="button" className="min-h-11 px-3 py-2 text-sm underline"
              onClick={() => setVisibleCount(PAGE_SIZE)}>
              Show fewer
            </button>
          )}
        </div>
      )}
    </section>
  );
}
""", encoding="utf-8")
print("Created task-group pager with five-at-a-time rows and persistent group state.")
