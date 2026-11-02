import { useQuery } from "@tanstack/react-query";
import { subDays } from "date-fns";
import { base44 } from "@/api/base44Client";

/**
 * Live activity signals for one goal, all via count() (no records loaded to count):
 * - tasks linked directly to the goal or to any of its projects (done vs total)
 * - habit logs for the goal's habits over the last 30 days (done vs done+missed)
 */
export default function useGoalActivity(goal, projects = []) {
  const projectIds = projects.map((p) => p.id).sort();
  const { data } = useQuery({
    queryKey: ["goal-activity", goal.id, projectIds.join(",")],
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const ws = goal.workspace || "personal";
      const taskQ = { workspace: ws, $or: [{ goal_id: goal.id }, ...(projectIds.length ? [{ project_id: { $in: projectIds } }] : [])] };
      const habits = await base44.entities.Habit.filter({ workspace: ws, goal_id: goal.id }, { limit: 50, fields: ["id"] });
      const habitIds = habits.items.map((h) => h.id);
      const logQ = (status) => ({ habit_id: { $in: habitIds }, status, date: { $gte: subDays(new Date(), 30).toISOString().slice(0, 10) } });
      const [tasksTotal, tasksDone, logsDone, logsMissed] = await Promise.all([
        base44.entities.Task.count(taskQ),
        base44.entities.Task.count({ ...taskQ, status: "done" }),
        habitIds.length ? base44.entities.HabitLog.count(logQ("done")) : 0,
        habitIds.length ? base44.entities.HabitLog.count(logQ("missed")) : 0,
      ]);
      return { tasksTotal, tasksDone, logsDone, logsMissed };
    },
  });
  return data;
}