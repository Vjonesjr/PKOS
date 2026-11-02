import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Target } from "lucide-react";
import { base44 } from "@/api/base44Client";
import Widget from "@/components/dashboard/Widget";
import GoalProgressRow from "@/components/dashboard/GoalProgressRow";
import { weeksAgo } from "@/lib/weeks";

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
          {data.goals.map((g) => (
            <GoalProgressRow key={g.id} goal={g} projects={data.projects.filter((p) => p.goal_id === g.id)} latest={data.latest[g.id]} />
          ))}
        </div>
      )}
    </Widget>
  );
}