import { format } from "date-fns";

// Status patch that stamps completed_date when a task becomes done and clears it otherwise.
export function taskStatusPatch(task, status) {
  if (status === "done") return { status, completed_date: task.status === "done" && task.completed_date ? task.completed_date : format(new Date(), "yyyy-MM-dd") };
  return { status, completed_date: null };
}