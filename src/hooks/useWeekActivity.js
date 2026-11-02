import { useQuery } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import { base44 } from "@/api/base44Client";

/** Everything completed in one week (Mon..Sun): tasks, habit check-offs and lessons. */
export default function useWeekActivity(workspace, week) {
  return useQuery({
    queryKey: ["week-activity", workspace, week],
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const end = format(addDays(new Date(week + "T00:00:00"), 7), "yyyy-MM-dd");
      const [tasks, logs, habits, lessons, missed] = await Promise.all([
        base44.entities.Task.filter({ workspace, status: "done", completed_date: { $gte: week, $lt: end } }, { sort: "-completed_date", limit: 100, fields: ["title", "completed_date", "project_id"] }),
        base44.entities.HabitLog.filter({ workspace, status: "done", date: { $gte: week, $lt: end } }, { sort: "-date", limit: 300, fields: ["habit_id", "date"] }),
        base44.entities.Habit.filter({ workspace }, { limit: 100, fields: ["title"] }),
        base44.entities.Lesson.filter({ workspace, created_date: { $gte: week, $lt: end } }, { sort: "-created_date", limit: 50, fields: ["title", "learned", "created_date"] }),
        base44.entities.HabitLog.count({ workspace, status: "missed", date: { $gte: week, $lt: end } }),
      ]);
      const names = Object.fromEntries(habits.items.map((h) => [h.id, h.title]));
      const perHabit = {};
      logs.items.forEach((l) => (perHabit[l.habit_id] = (perHabit[l.habit_id] || 0) + 1));
      return {
        tasks: tasks.items,
        lessons: lessons.items,
        habitDone: logs.items.length,
        habitMissed: missed,
        habits: Object.entries(perHabit).map(([id, n]) => ({ id, title: names[id] || "Habit", count: n })).sort((a, b) => b.count - a.count),
      };
    },
  });
}