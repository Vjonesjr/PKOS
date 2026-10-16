import { format, addDays, addWeeks, addMonths, parseISO } from "date-fns";
import { base44 } from "@/api/base44Client";

export const RECURRENCES = [["none", "Does not repeat"], ["daily", "Daily"], ["weekly", "Weekly"], ["monthly", "Monthly"]];
const STEP = { daily: addDays, weekly: addWeeks, monthly: addMonths };

// Status patch that stamps completed_date when a task becomes done and clears it otherwise.
export function taskStatusPatch(task, status) {
  if (status === "done") return { status, completed_date: task.status === "done" && task.completed_date ? task.completed_date : format(new Date(), "yyyy-MM-dd") };
  return { status, completed_date: null };
}

// When a repeating task is completed, create the next occurrence once.
// The finished task stops repeating, so toggling it again never spawns duplicates.
export async function spawnNextIfRecurring(task, newStatus) {
  const step = STEP[task.recurrence];
  if (!step || newStatus !== "done" || task.status === "done") return;
  const base = task.due_date ? parseISO(task.due_date) : new Date();
  await base44.entities.Task.create({
    title: task.title, description: task.description, priority: task.priority,
    project_id: task.project_id, workspace: task.workspace, recurrence: task.recurrence,
    due_date: format(step(base, 1), "yyyy-MM-dd"),
  });
  await base44.entities.Task.update(task.id, { recurrence: "none" });
}