import React from "react";
import { ENTITY_CONFIG } from "@/lib/entityConfig";

export default function PackPreview({ records, projects }) {
  const chars = records.reduce((sum, r) => sum + JSON.stringify(r.record).length, 0);
  const tokens = Math.round(chars / 4);
  const counts = records.reduce((acc, r) => ({ ...acc, [r.type]: (acc[r.type] || 0) + 1 }), {});
  const projectIds = new Set(records.map((r) => (r.type === "project" ? r.record.id : r.record.project_id)).filter(Boolean));
  const projectNames = [...projectIds].map((id) => projects.find((p) => p.id === id)?.title).filter(Boolean);

  const Stat = ({ label, children }) => (
    <div className="rounded-xl border border-border bg-background/40 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm text-foreground/90">{children}</div>
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat label="Included Records">{records.length}</Stat>
      <Stat label="Approximate Size">~{tokens.toLocaleString()} tokens</Stat>
      <Stat label="Source Types">
        {Object.keys(counts).length === 0 ? "None" : Object.entries(counts).map(([t, n]) => `${ENTITY_CONFIG[t]?.label} (${n})`).join(", ")}
      </Stat>
      <Stat label="Projects Represented">{projectNames.length ? projectNames.join(", ") : "None"}</Stat>
    </div>
  );
}