import React, { useState } from "react";
import { ChevronDown, FolderKanban, Inbox } from "lucide-react";
import ParsedItem from "@/components/parse/ParsedItem";

/** A project group: active todos first, completed items collapsed by default. */
export default function ParsedGroup({ name, isExisting, entries, onChange }) {
  const [showDone, setShowDone] = useState(false);
  const active = entries.filter(({ item }) => !item.done);
  const done = entries.filter(({ item }) => item.done);
  const Icon = name === "Inbox" ? Inbox : FolderKanban;
  const row = ({ item, index }) => <ParsedItem key={index} item={item} onChange={(v) => onChange(index, v)} />;
  return (
    <section className="space-y-2 rounded-xl border border-border bg-card p-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="h-4 w-4 text-primary" />{name}
        {name !== "Inbox" && <span className="text-[10px] font-normal text-muted-foreground">{isExisting ? "existing project" : "new project"}</span>}
      </h3>
      {active.map(row)}
      {done.length > 0 && (
        <>
          <button onClick={() => setShowDone(!showDone)} className="flex items-center gap-1 text-xs text-muted-foreground" aria-expanded={showDone}>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showDone ? "" : "-rotate-90"}`} /> Completed ({done.length})
          </button>
          {showDone && done.map(row)}
        </>
      )}
    </section>
  );
}