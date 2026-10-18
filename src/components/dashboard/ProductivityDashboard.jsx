import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { subDays } from "date-fns";
import { base44 } from "@/api/base44Client";
import GoalProgressWidget from "@/components/dashboard/GoalProgressWidget";
import TaskCompletionWidget from "@/components/dashboard/TaskCompletionWidget";
import HabitConsistencyWidget from "@/components/dashboard/HabitConsistencyWidget";
import ProjectHealthWidget from "@/components/dashboard/ProjectHealthWidget";
import KnowledgeGrowthWidget from "@/components/dashboard/KnowledgeGrowthWidget";

const RANGES = [7, 30, 90];

/** All counts come from server-side aggregates — nothing is loaded just to count it. */
export default function ProductivityDashboard({ workspace }) {
  const [range, setRange] = useState(30);
  const since = subDays(new Date(), range).toISOString().slice(0, 10);

  // Aggregates are rate-limited (~15/min), so fetch the full 90-day daily series once per
  // workspace and cache it; switching ranges just slices it client-side.
  const { data: base } = useQuery({
    queryKey: ["progress-base", workspace],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const from = subDays(new Date(), 90).toISOString();
      const T = base44.entities.Task;
      const [done, created, projects] = await Promise.all([
        T.aggregate({ query: { workspace, status: "done", completed_date: { $gte: from.slice(0, 10) } }, groupBy: "completed_date" }),
        T.aggregate({ query: { workspace, created_date: { $gte: from } }, dateBucket: { field: "created_date", unit: "day" } }),
        base44.entities.Project.aggregate({ query: { workspace }, groupBy: "status" }),
      ]);
      return { done: done.rows, created: created.rows, projects: projects.rows };
    },
  });

  // Range-specific totals use count(), which has a much higher limit than aggregate.
  const { data: counts } = useQuery({
    queryKey: ["progress-counts", workspace, range],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const q = { workspace, created_date: { $gte: subDays(new Date(), range).toISOString() } };
      const [knowledge, links] = await Promise.all([base44.entities.Knowledge.count(q), base44.entities.Link.count(q)]);
      return { knowledge, links };
    },
  });

  const inRange = (rows, field) => rows?.filter((r) => String(r[field]).slice(0, 10) >= since);
  const stats = base && {
    done: inRange(base.done, "completed_date"),
    created: inRange(base.created, "created_date"),
    projects: base.projects,
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Progress</p>
        <div className="flex rounded-lg border border-border p-0.5">
          {RANGES.map((r) => (
            <button key={r} onClick={() => setRange(r)} className={`rounded-md px-2.5 py-1 text-xs ${range === r ? "bg-secondary text-foreground" : "text-muted-foreground"}`}>{r}d</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        <GoalProgressWidget workspace={workspace} />
        <HabitConsistencyWidget workspace={workspace} />
        <TaskCompletionWidget done={stats?.done} created={stats?.created} unit={range === 7 ? "day" : "week"} />
        <ProjectHealthWidget rows={stats?.projects} workspace={workspace} />
        <KnowledgeGrowthWidget added={counts?.knowledge} links={counts?.links} range={range} />
      </div>
    </section>
  );
}