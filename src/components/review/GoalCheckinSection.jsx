import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Target } from "lucide-react";
import { base44 } from "@/api/base44Client";
import GoalCheckinCard from "@/components/review/GoalCheckinCard";
import WeekSummary from "@/components/review/WeekSummary";
import { weekStart, weeksAgo } from "@/lib/weeks";

/** Optional weekly check-in for each active goal, keyed by (goal, ISO week). */
export default function GoalCheckinSection({ workspace }) {
  const [data, setData] = useState(null);
  const week = weekStart();

  const load = useCallback(async () => {
    const [goals, projects, checkins] = await Promise.all([
      base44.entities.Goal.filter({ workspace, status: "Active" }, { sort: "target_date", limit: 20 }),
      base44.entities.Project.filter({ workspace, goal_id: { $exists: true } }, { limit: 200, fields: ["goal_id", "status", "progress"] }),
      base44.entities.GoalCheckin.filter({ workspace, week_start: { $gte: weeksAgo(8) } }, { sort: "-week_start", limit: 200 }),
    ]);
    setData({ goals: goals.items, projects: projects.items, checkins: checkins.items });
  }, [workspace]);

  useEffect(() => { load(); }, [load]);

  if (!data) return <p className="text-xs text-muted-foreground">Loading goals...</p>;
  if (!data.goals.length) return (
    <Link to="/goals" className="flex items-center gap-2 rounded-xl border border-dashed border-primary/40 p-4 text-sm text-primary">
      <Target className="h-4 w-4" /> Set a goal to start weekly check-ins
    </Link>
  );

  const thisWeek = data.checkins.filter((c) => c.week_start === week);
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card/60 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Goal check-in</p>
        <p className="text-xs text-muted-foreground">{thisWeek.length} of {data.goals.length} done</p>
      </div>
      {data.goals.map((g) => (
        <GoalCheckinCard key={g.id} goal={g} week={week} workspace={workspace}
          projects={data.projects.filter((p) => p.goal_id === g.id)}
          history={data.checkins.filter((c) => c.goal_id === g.id)} onSaved={load} />
      ))}
      <WeekSummary workspace={workspace} week={week} disabled={!thisWeek.length} />
    </div>
  );
}