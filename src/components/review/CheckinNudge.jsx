import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Target } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { weekStart } from "@/lib/weeks";

/** Fri–Sun nudge on Today when active goals lack this week's check-in. */
export default function CheckinNudge({ workspace }) {
  const [missing, setMissing] = useState(0);
  const isWeekend = [0, 5, 6].includes(new Date().getDay());

  useEffect(() => {
    if (!isWeekend) return;
    Promise.all([
      base44.entities.Goal.count({ workspace, status: "Active" }),
      base44.entities.GoalCheckin.count({ workspace, week_start: weekStart() }),
    ]).then(([goals, done]) => setMissing(Math.max(0, goals - done)));
  }, [workspace, isWeekend]);

  if (!missing) return null;
  return (
    <Link to="/review" className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground/90">
      <Target className="h-4 w-4 shrink-0 text-primary" />
      {missing} goal{missing > 1 ? "s" : ""} waiting for this week's check-in →
    </Link>
  );
}