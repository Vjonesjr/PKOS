import React from "react";

const STYLES = {
  done: "bg-primary",
  skipped: "bg-muted-foreground/40",
  missed: "bg-destructive/50",
};

export default function HabitDayDot({ date, status, due }) {
  const cls = STYLES[status] || (due ? "border border-border bg-secondary" : "bg-transparent border border-dashed border-border/50");
  return <div title={`${date}${status ? `: ${status}` : ""}`} className={`h-4 w-4 shrink-0 rounded ${cls}`} />;
}