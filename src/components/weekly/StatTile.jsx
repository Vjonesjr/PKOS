import React from "react";

export default function StatTile({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5 text-primary" /> {label}</div>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}