import React from "react";
import { Link } from "react-router-dom";
import { useWorkspace, WORKSPACES } from "@/lib/WorkspaceContext";

export default function WorkspaceSwitcherButton({ className = "" }) {
  const { workspace } = useWorkspace();
  const meta = WORKSPACES[workspace];

  return (
    <Link
      to="/workspaces"
      className={`flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs font-medium text-foreground/90 transition-colors hover:border-primary/40 ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${workspace === "demo" ? "bg-amber-400" : "bg-emerald-400"}`} />
      {meta.label}
    </Link>
  );
}