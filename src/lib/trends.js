import { format, startOfWeek, parseISO, subDays } from "date-fns";
import { base44 } from "@/api/base44Client";
import { isDue, ymd } from "@/lib/habits";

// Ranges start at 3 days so new users see a chart right away.
export const TREND_RANGES = [
  { key: "3d", label: "3d", days: 3, unit: "day" },
  { key: "7d", label: "7d", days: 7, unit: "day" },
  { key: "14d", label: "14d", days: 14, unit: "day" },
  { key: "8w", label: "8w", days: 56, unit: "week" },
];

const dayList = (n) => Array.from({ length: n }, (_, i) => ymd(subDays(new Date(), n - 1 - i)));
const weekKey = (d) => ymd(startOfWeek(parseISO(d), { weekStartsOn: 1 }));

/** Fold per-day points into buckets (day or ISO week), summing numeric fields. */
function bucket(points, unit) {
  if (unit === "day") return points.map((p) => ({ ...p, label: format(parseISO(p.date), "EEE d") }));
  const map = new Map();
  points.forEach((p) => {
    const k = weekKey(p.date);
    const b = map.get(k) || { date: k, done: 0, due: 0, completed: 0 };
    b.done += p.done || 0; b.due += p.due || 0; b.completed += p.completed || 0;
    map.set(k, b);
  });
  return [...map.values()].map((b) => ({ ...b, label: format(parseISO(b.date), "MMM d") }));
}

/** Habit completion rate per bucket. Days before a habit existed don't count as due. */
export async function loadHabitTrend(workspace, range) {
  const days = dayList(range.days);
  const [habits, agg] = await Promise.all([
    base44.entities.Habit.filter({ workspace, active: true }, { limit: 100, fields: ["schedule_type", "weekdays", "per_week_target", "start_date", "created_date"] }),
    base44.entities.HabitLog.aggregate({ query: { workspace, status: "done", date: { $gte: days[0] } }, groupBy: "date" }),
  ]);
  const doneByDay = Object.fromEntries(agg.rows.map((r) => [r.date, r.count]));
  const points = days.map((date) => {
    const due = habits.items.reduce((sum, h) => {
      const start = h.start_date || (h.created_date || "").slice(0, 10);
      if (start && date < start) return sum;
      if (h.schedule_type === "per_week") return sum + (h.per_week_target || 1) / 7;
      return sum + (isDue(h, date) ? 1 : 0);
    }, 0);
    return { date, done: doneByDay[date] || 0, due };
  });
  return {
    habitCount: habits.items.length,
    points: bucket(points, range.unit).map((p) => ({ ...p, rate: p.due ? Math.min(100, Math.round((p.done / p.due) * 100)) : null })),
  };
}

/** Tasks completed per bucket + current average progress of active projects. */
export async function loadMomentum(workspace, range) {
  const days = dayList(range.days);
  const [tasks, progress, top] = await Promise.all([
    base44.entities.Task.aggregate({ query: { workspace, status: "done", completed_date: { $gte: days[0] } }, groupBy: "completed_date" }),
    base44.entities.Project.aggregate({ query: { workspace, status: "Active" }, groupBy: "status", avg: "progress" }),
    base44.entities.Project.filter({ workspace, status: "Active" }, { sort: "-updated_date", limit: 5, fields: ["title", "progress"] }),
  ]);
  const byDay = Object.fromEntries(tasks.rows.map((r) => [r.completed_date, r.count]));
  return {
    points: bucket(days.map((date) => ({ date, completed: byDay[date] || 0 })), range.unit),
    avgProgress: Math.round(progress.rows[0]?.avg_progress || 0),
    projects: top.items,
  };
}