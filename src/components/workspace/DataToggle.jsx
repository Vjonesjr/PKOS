import React from "react";
import { useWorkspace } from "@/lib/WorkspaceContext";

/** Compact switch between the user's own data and the demo data, for entry screens. */
export default function DataToggle() {
  const { workspace, setWorkspace } = useWorkspace();
  const opt = (key, label) => (
    <button key={key} onClick={() => setWorkspace(key)} aria-pressed={workspace === key}
      className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${workspace === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
      {label}
    </button>
  );
  return <div className="inline-flex rounded-lg border border-border bg-card p-0.5">{opt("personal", "My data")}{opt("demo", "Demo")}</div>;
}