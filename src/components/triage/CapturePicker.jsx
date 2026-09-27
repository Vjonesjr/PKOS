import React from "react";
import { Inbox } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import EmptyState from "@/components/shared/EmptyState";
import StatusBadge from "@/components/shared/StatusBadge";

export default function CapturePicker({ captures, selected, onToggle, onToggleAll }) {
  if (captures.length === 0) return <EmptyState icon={Inbox} title="Your inbox is empty" description="New captures will appear here for triage." />;
  const allSelected = selected.size === captures.length;
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4">
      <label className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Checkbox checked={allSelected} onCheckedChange={onToggleAll} /> Select all ({captures.length})
      </label>
      <div className="space-y-1.5">
        {captures.map((c) => (
          <label key={c.id} className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 hover:bg-secondary/50">
            <Checkbox checked={selected.has(c.id)} onCheckedChange={() => onToggle(c.id)} className="mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <StatusBadge value={c.type} />
                <span className="truncate text-sm text-foreground/90">{c.title || c.content}</span>
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}