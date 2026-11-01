"""Pass 5: install a safe, reusable task-group pagination component.

This does not mutate task records. The component is ready for integration into
the Tasks screen after its source structure is inspected.
"""
from pathlib import Path
p=Path("app/src/components/tasks/TaskGroupPager.jsx")
assert not p.exists(), "TaskGroupPager already exists: inspect before replacing"
p.parent.mkdir(parents=True,exist_ok=True)
p.write_text("""import React, { useEffect, useState } from 'react';

const PAGE_SIZE = 5;

/** Presentational pagination: never deletes, filters or modifies stored tasks. */
export default function TaskGroupPager({ groupKey, items = [], renderItem, defaultExpanded = true }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [groupKey]);
  const shown = expanded ? items.slice(0, visibleCount) : [];
  const remaining = Math.max(0, items.length - visibleCount);
  return (
    <section aria-label={groupKey}>
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(v => !v)}>
        {groupKey} ({items.length}) {expanded ? '−' : '+'}
      </button>
      {expanded && (
        <>
          {shown.map(renderItem)}
          {remaining > 0 && <button type="button" onClick={() => setVisibleCount(n => n + PAGE_SIZE)}>
            Show {Math.min(PAGE_SIZE, remaining)} more
          </button>}
          {visibleCount > PAGE_SIZE && <button type="button" onClick={() => setVisibleCount(PAGE_SIZE)}>
            Show fewer
          </button>}
        </>
      )}
    </section>
  );
}
""", encoding="utf-8")
print("TaskGroupPager component created; requires Tasks.jsx integration.")
