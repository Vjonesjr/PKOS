import React from "react";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { goalProgress } from "@/lib/goals";
import { statusMeta } from "@/lib/weeks";
import useGoalActivity from "@/hooks/useGoalActivity";

/** One goal row in the dashboard widget, with live task/habit activity blended in. */
export default function GoalProgressRow({ goal, projects, latest }) {
  const activity = useGoalActivity(goal, projects);
  const pct = goalProgress(goal, projects, activity);
  const meta = statusMeta(latest);
  return (
    <Link to="/goals" className="block space-y-1">
      <div className="flex justify-between gap-2 text-xs"><span className="flex min-w-0 items-center gap-1.5">
          <span title={meta?.label || "No recent check-in"} className={`h-2 w-2 shrink-0 rounded-full ${meta?.dot || "bg-muted-foreground/30"}`} />
          <span className="truncate text-foreground/90">{goal.title}</span>
        </span><span className="text-muted-foreground">{pct}%</span></div>
      <Progress value={pct} className="h-1.5" />
    </Link>
  );
}