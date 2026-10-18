import { useQuery } from "@tanstack/react-query";
import { subWeeks, format } from "date-fns";
import { base44 } from "@/api/base44Client";
import { weekStart } from "@/lib/weeks";

const WEEKS = 8;

/**
 * Weekly trend per active goal over the last 8 weeks:
 * tasks finished (linked directly or via the goal's projects) and habit consistency %.
 * Uses one page per source with only the fields needed for bucketing.
 */
export default function useGoalTrends(workspace) {
  return useQuery({
    queryKey: ["goal-trends", workspace],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const from = weekStart(subWeeks(new Date(), WEEKS - 1));
      const [goals, projects, habits, tasks, logs] = await Promise.all([
        base44.entities.Goal.filter({ workspace, status: "Active" }, { sort: "target_date", limit: 10 }),
        base44.entities.Project.filter({ workspace, goal_id: { $exists: true } }, { limit: 200, fields: ["goal_id", "status", "progress"] }),
        base44.entities.Habit.filter({ workspace, goal_id: { $exists: true } }, { limit: 100, fields: ["goal_id"] }),
        base44.entities.Task.filter({ workspace, status: "done", completed_date: { $gte: from } }, { limit: 2000, fields: ["goal_id", "project_id", "completed_date"] }),
        base44.entities.HabitLog.filter({ workspace, date: { $gte: from }, status: { $in: ["done", "missed"] } }, { limit: 3000, fields: ["habit_id", "date", "status"] }),
      ]);
      const weeks = Array.from({ length: WEEKS }, (_, i) => weekStart(subWeeks(new Date(), WEEKS - 1 - i)));
      const projGoal = Object.fromEntries(projects.items.map((p) => [p.id, p.goal_id]));
      const habitGoal = Object.fromEntries(habits.items.map((h) => [h.id, h.goal_id]));
      const series = {};
      const bucket = (gid, wk) => {
        series[gid] ??= Object.fromEntries(weeks.map((w) => [w, { tasks: 0, done: 0, missed: 0 }]));
        return series[gid][wk];
      };
      tasks.items.forEach((t) => {
        const gid = t.goal_id || projGoal[t.project_id];
        const wk = weekStart(new Date(t.completed_date.slice(0, 10) + "T00:00:00"));
        if (gid && weeks.includes(wk)) bucket(gid, wk).tasks++;
      });
      logs.items.forEach((l) => {
        const gid = habitGoal[l.habit_id];
        const wk = weekStart(new Date(l.date.slice(0, 10) + "T00:00:00"));
        if (gid && weeks.includes(wk)) bucket(gid, wk)[l.status]++;
      });
      return {
        goals: goals.items,
        projects: projects.items,
        trend: (gid) => weeks.map((w) => {
          const b = series[gid]?.[w] || { tasks: 0, done: 0, missed: 0 };
          const n = b.done + b.missed;
          return { week: format(new Date(w + "T00:00:00"), "MMM d"), tasks: b.tasks, habits: n ? Math.round((b.done / n) * 100) : null };
        }),
      };
    },
  });
}