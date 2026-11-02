import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useWorkspace } from "@/lib/WorkspaceContext";

/** Shared tag pool: shows existing tags from across the workspace so they can be reused. */
export default function TagPool({ value = "", onChange, workspace }) {
  const [allTags, setAllTags] = useState([]);
  const { workspace: ctxWorkspace } = useWorkspace();
  const ws = workspace || ctxWorkspace;

  useEffect(() => {
    if (!ws) return;
    base44.entities.Knowledge.filter({ workspace: ws }, "-updated_date", 200)
      .then((items) => {
        const set = new Set();
        (items || []).forEach((k) => (k.tags || []).forEach((t) => set.add(t)));
        setAllTags(Array.from(set).sort());
      })
      .catch(() => setAllTags([]));
  }, [ws]);

  const selected = useMemo(() => value.split(",").map((t) => t.trim()).filter(Boolean), [value]);

  const toggle = (tag) => {
    const next = selected.includes(tag)
      ? selected.filter((t) => t !== tag)
      : [...selected, tag];
    onChange(next.join(", "));
  };

  if (allTags.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Reuse tags</p>
      <div className="flex flex-wrap gap-1.5">
        {allTags.slice(0, 24).map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggle(tag)}
            className={`rounded-full border pk-feedback-low px-2.5 py-0.5 text-xs transition ${
              selected.includes(tag)
                ? "border-primary bg-primary/20 text-primary"
                : "border-primary/25 bg-secondary/40 text-muted-foreground hover:border-primary/50"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
