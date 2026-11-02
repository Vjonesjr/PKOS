import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SORTS, GROUPS } from "@/lib/taskQueue";

const VIEWS = [["list", "List"], ["card", "Cards"], ["compact", "Compact"]];

const Pick = ({ value, onChange, options, label }) => (
  <label className="min-w-0 space-y-1 text-xs text-muted-foreground">
    <span>{label}</span>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-11 w-full text-sm" aria-label={label}><SelectValue /></SelectTrigger>
      <SelectContent>{options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
    </Select>
  </label>
);

export default function QueueControls({ sort, setSort, group, setGroup, view, setView, showDone, setShowDone }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Pick value={sort} onChange={setSort} options={SORTS} label="Sort tasks" />
      <Pick value={group} onChange={setGroup} options={GROUPS} label="Group tasks" />
      <Pick value={view} onChange={setView} options={VIEWS} label="Task queue view" />
      <button type="button" aria-pressed={showDone} onClick={() => setShowDone(!showDone)} className="min-h-11 self-end rounded-lg border border-border px-3 text-sm text-muted-foreground hover:text-primary">
        {showDone ? "Hide completed tasks" : "Show completed tasks"}
      </button>
    </div>
  );
}
