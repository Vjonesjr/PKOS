import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SORTS, GROUPS } from "@/lib/taskQueue";

const Pick = ({ value, onChange, options, label }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="h-8 min-w-0 flex-1 text-xs" aria-label={label}><SelectValue /></SelectTrigger>
    <SelectContent>{options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
  </Select>
);

export default function QueueControls({ sort, setSort, group, setGroup, showDone, setShowDone }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Pick value={sort} onChange={setSort} options={SORTS} label="Sort tasks" />
      <Pick value={group} onChange={setGroup} options={GROUPS} label="Group tasks" />
      <button type="button" onClick={() => setShowDone(!showDone)} className="text-xs text-muted-foreground hover:text-primary">
        {showDone ? "Hide Complete" : "Show Complete"}
      </button>
    </div>
  );
}