import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Target } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Progress } from "@/components/ui/progress";
import Widget from "@/components/dashboard/Widget";
import { goalProgress } from "@/lib/goals";

export default function GoalProgressWidget({ workspace }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    Promise.all([
      base44.entities.Goal.filter({ workspace, status: "Active" }, { sort: "target_date", limit: 5 }),
      base44.entities.Project.filter({ workspace, goal_id: { $exists: true } }, { limit: 200, fields: ["goal_id", "status", "progress"] }),
    ]).then(([g, p]) => setData({ goals: g.items, projects: p.items }));
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
                <div className="flex justify-between gap-2 text-xs"><span className="truncate text-foreground/90">{g.title}</span><span className="text-muted-foreground">{pct}%</span></div>
                <Progress value={pct} className="h-1.5" />
              </Link>
            );
          })}
        </div>
      )}
    </Widget>
  );
}