import React from "react";
import { cn } from "@/lib/utils";

const STYLES = {
  // project statuses
  Idea: "bg-slate-500/15 text-slate-300",
  Planned: "bg-sky-500/15 text-sky-300",
  Active: "bg-emerald-500/15 text-emerald-300",
  Waiting: "bg-amber-500/15 text-amber-300",
  Completed: "bg-violet-500/15 text-violet-300",
  Archived: "bg-slate-600/15 text-slate-400",
  // task/generic statuses
  todo: "bg-slate-500/15 text-slate-300",
  in_progress: "bg-sky-500/15 text-sky-300",
  done: "bg-emerald-500/15 text-emerald-300",
  inbox: "bg-cyan-500/15 text-cyan-300",
  processed: "bg-slate-600/15 text-slate-400",
  // priority
  low: "bg-slate-500/15 text-slate-300",
  medium: "bg-amber-500/15 text-amber-300",
  high: "bg-rose-500/15 text-rose-300",
};

export default function StatusBadge({ value, className }) {
  if (!value) return null;
  const style = STYLES[value] || "bg-slate-500/15 text-slate-300";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize tracking-wide", style, className)}>
      {value.replace(/_/g, " ")}
    </span>
  );
}