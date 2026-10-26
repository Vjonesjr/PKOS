import React, { useMemo, useState } from "react";
import { Circle, RotateCcw, TriangleAlert } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { taskStatusPatch } from "@/lib/taskStatus";

const CAPACITY_LIMIT = 5;

export default function TodayBrief({ tasks, projects, onChanged }) {
  const today = format(new Date(), "yyyy-MM-dd");
  const [undoing, setUndoing] = useState(false);
  const todayTasks = useMemo(() => tasks.filter((task) => task.today_date === today), [tasks, today]);
  const openTodayTasks = todayTasks.filter((task) => task.status !== "done");
  const completedTodayTasks = todayTasks.filter((task) => task.status === "done");
  const nextAction = openTodayTasks[0] || tasks.find((task) => task.status !== "done");
  const focusProject = projects.find((project) => project.status === "Active" && project.next_action);
  const stalledProjects = projects.filter((project) => project.status === "Active" && (!project.next_action || new Date(project.updated_date) < new Date(Date.now() - 14 * 86400000)));
  const capacityLabel = todayTasks.length >= CAPACITY_LIMIT ? "At capacity" : `${CAPACITY_LIMIT - todayTasks.length} open slot${CAPACITY_LIMIT - todayTasks.length === 1 ? "" : "s"}`;

  const undoLatest = async () => {
    const latest = completedTodayTasks[completedTodayTasks.length - 1];
    if (!latest) return;
    setUndoing(true);
    await base44.entities.Task.update(latest.id, taskStatusPatch(latest, "todo"));
    setUndoing(false);
    onChanged?.();
  };

  return (
    <section aria-labelledby="today-brief-heading" className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Today Brief</p>
          <h2 id="today-brief-heading" className="mt-1 text-lg font-semibold text-foreground">A clear next step for {format(new Date(), "EEEE")}</h2>
        </div>
        <Link to="/today" className="inline-flex min-h-9 items-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary">Open full brief</Link>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card/70 p-3">
          <p className="text-xs text-muted-foreground">Next action</p>
          <p className="mt-1 line-clamp-2 text-sm font-medium text-foreground">{nextAction?.title || "Choose one small action"}</p>
        </div>
        <div className="rounded-xl border border-border bg-card/70 p-3">
          <p className="text-xs text-muted-foreground">Focus</p>
          <p className="mt-1 line-clamp-2 text-sm font-medium text-foreground">{focusProject?.title || "No active project focus yet"}</p>
        </div>
        <div className="rounded-xl border border-border bg-card/70 p-3">
          <p className="text-xs text-muted-foreground">Capacity</p>
          <p className="mt-1 text-sm font-medium text-foreground">{todayTasks.length} planned · {capacityLabel}</p>
        </div>
        <div className="rounded-xl border border-border bg-card/70 p-3">
          <p className="text-xs text-muted-foreground">Completed</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground">{completedTodayTasks.length} today</p>
            <button type="button" disabled={!completedTodayTasks.length || undoing} onClick={undoLatest} className="inline-flex h-7 items-center rounded-md px-2 text-xs text-muted-foreground hover:bg-secondary disabled:pointer-events-none disabled:opacity-50"><RotateCcw className="mr-1 h-3 w-3" /> Undo</button>
          </div>
        </div>
      </div>
      {(stalledProjects.length > 0 || openTodayTasks.length > 0) && (
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
          {openTodayTasks.slice(0, 3).map((task) => <span key={task.id} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1"><Circle className="h-3 w-3" /> {task.title}</span>)}
          {stalledProjects.slice(0, 2).map((project) => <span key={project.id} className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-amber-700 dark:text-amber-300"><TriangleAlert className="h-3 w-3" /> Review {project.title}</span>)}
        </div>
      )}
    </section>
  );
}
