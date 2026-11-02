import React from "react";
import { Link } from "react-router-dom";
import useGoalTrends from "@/hooks/useGoalTrends";
import GoalTrendCard from "@/components/weekly/GoalTrendCard";

export default function GoalVisualizer({ workspace }) {
  const { data } = useGoalTrends(workspace);
  return (
    <section className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">Goal progress</p>
      {!data ? <p className="text-sm text-muted-foreground">Loading...</p> : !data.goals.length ? (
        <Link to="/goals" className="block rounded-lg border border-dashed border-primary/40 p-3 text-center text-sm text-primary">Set your first goal →</Link>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {data.goals.map((g) => (
            <GoalTrendCard key={g.id} goal={g} projects={data.projects.filter((p) => p.goal_id === g.id)} trend={data.trend(g.id)} />
          ))}
        </div>
      )}
    </section>
  );
}