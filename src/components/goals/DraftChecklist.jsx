import React from "react";
import { Checkbox } from "@/components/ui/checkbox";

export default function DraftChecklist({ title, items, selected, onToggle }) {
  if (!items.length) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      {items.map((it) => (
        <label key={it.key} className="flex cursor-pointer items-start gap-2 rounded-lg border border-border p-2">
          <Checkbox checked={selected.has(it.key)} onCheckedChange={() => onToggle(it.key)} className="mt-0.5" />
          <span className="min-w-0">
            <span className="block text-sm text-foreground break-words">{it.label}</span>
            {it.hint && <span className="block text-[11px] text-muted-foreground">{it.hint}</span>}
          </span>
        </label>
      ))}
    </div>
  );
}