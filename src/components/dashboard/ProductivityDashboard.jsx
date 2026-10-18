import React, { useEffect, useState } from "react";
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
  const [stats, setStats] = useState(null);

  useEffect(() => {
    setStats(null);
    const since = subDays(new Date(), range).toISOString();
    const unit = range === 7 ? "day" : "week";
    const T = base44.entities.Task;
    Promise.all([
      // Week buckets only work on created/updated_date, so fetch daily rows; the widget folds them into weeks.
      T.aggregate({ query: { workspace, status: "done", completed_date: { $gte: since.slice(0, 10) } }, groupBy: "completed_date" }),
      T.aggregate({ query: { workspace, created_date: { $gte: since } }, dateBucket: { field: "created_date", unit: "day" } }),
      base44.entities.Project.aggregate({ query: { workspace }, groupBy: "status" }),
      base44.entities.Knowledge.aggregate({ query: { workspace, created_date: { $gte: since } }, dateBucket: { field: "created_date", unit } }),
      base44.entities.Link.count({ workspace, created_date: { $gte: since } }),
    ]).then(([done, created, projects, knowledge, links]) => setStats({ done: done.rows, created: created.rows, projects: projects.rows, knowledge: knowledge.rows, links }));
  }, [workspace, range]);

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
        <KnowledgeGrowthWidget rows={stats?.knowledge} links={stats?.links} range={range} />
      </div>
    </section>
  );
}