import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Target } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Progress } from "@/components/ui/progress";
import Widget from "@/components/dashboard/Widget";
import { goalProgress } from "@/lib/goals";
import { weeksAgo, statusMeta } from "@/lib/weeks";

export default function GoalProgressWidget({ workspace }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    Promise.all([
      base44.entities.Goal.filter({ workspace, status: "Active" }, { sort: "target_date", limit: 5 }),
      base44.entities.Project.filter({ workspace, goal_id: { $exists: true } }, { limit: 200, fields: ["goal_id", "status", "progress"] }),
      base44.entities.GoalCheckin.filter({ workspace, week_start: { $gte: weeksAgo(2) } }, { sort: "-week_start", limit: 50, fields: ["goal_id", "status", "week_start"] }),
    ]).then(([g, p, c]) => {
      const latest = {};
      c.items.forEach((x) => (latest[x.goal_id] ??= x.status)); // sorted newest first
      setData({ goals: g.items, projects: p.items, latest });
    });
  }, [workspace]);

  return (
    <Widget title="Goals" icon={Target}>
      {!data ? <p className="text-xs text-muted-foreground">Loading...</p> : !data.goals.length ? (
        <Link to="/goals" className="block rounded-lg border border-dashed border-primary/40 p-3 text-center text-sm text-primary">Set your first goal →</Link>
      ) : (
        <div className="space-y-2.5">
          {data.goals.map((g) => {
            const pct = goalProgress(g, data.projects.filter((p) => p.goal_id === g.id));
            return (
              <Link key={g.id} to="/goals" className="block space-y-1">
                <div className="flex justify-between gap-2 text-xs"><span className="flex min-w-0 items-center gap-1.5">
                    <span title={statusMeta(data.latest[g.id])?.label || "No recent check-in"} className={`h-2 w-2 shrink-0 rounded-full ${statusMeta(data.latest[g.id])?.dot || "bg-muted-foreground/30"}`} />
                    <span className="truncate text-foreground/90">{g.title}</span>
                  </span><span className="text-muted-foreground">{pct}%</span></div>
                <Progress value={pct} className="h-1.5" />
              </Link>
            );
          })}
        </div>
      )}
    </Widget>
  );
}