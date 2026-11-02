import React from "react";
import { ShieldCheck, Eye } from "lucide-react";

export default function LevelBadge({ level }) {
  if (level === "review")
    return <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-300"><Eye className="h-3 w-3" /> Needs your approval</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300"><ShieldCheck className="h-3 w-3" /> Runs automatically</span>;
}