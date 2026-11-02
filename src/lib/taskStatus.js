import { format, addDays, addWeeks, addMonths, parseISO } from "date-fns";
import { base44 } from "@/api/base44Client";
import { advanceRecurringOccurrence } from "@/lib/recurringTasks";

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
    ...(task.parent_task_id ? {parent_task_id: task.parent_task_id} : {}),
    ...(task.goal_id ? {goal_id: task.goal_id} : {}),
    due_date: format(step(base, 1), "yyyy-MM-dd"),
    ...(task.scheduled_time ? { scheduled_time: task.scheduled_time, today_date: format(step(base, 1), "yyyy-MM-dd") } : {}),
  });
  await base44.entities.Task.update(task.id, { recurrence: "none" });
}
export function actionError(message) {
  window.dispatchEvent(new CustomEvent('pkos:action-error', { detail: { message } }));
}
export function taskSaved(task, previousStatus) {
  window.dispatchEvent(new CustomEvent('pkos:task-saved', { detail: { task, previousStatus } }));
}
// All task check-offs acknowledge the saved result, then announce where the task went.
export async function updateTaskStatus(task, status) {
  const patch = { ...taskStatusPatch(task, status), ...(status !== "done" && task.archived ? {archived:false} : {}) };
  let saved;
  try { saved = await base44.entities.Task.update(task.id, patch); }
  catch (e) { actionError(e.message || 'Could not save this task. It has not been checked off. Please retry.'); return null; }
  const next = { ...task, ...patch, ...saved };
  taskSaved(next, task.status || 'todo');
  try {
    if (task.recurrence_template_id && status === "done" && task.status !== "done") await advanceRecurringOccurrence(next, "completed");
    else await spawnNextIfRecurring(task, status);
  }
  catch { actionError('The task was completed, but its next repeat could not be created. Please check the repeating task.'); }
  if(next.project_id){try{const project=await base44.entities.Project.get(next.project_id);if(project.workspace===next.workspace&&!['Completed','Archived'].includes(project.status)){const open=await base44.entities.Task.filter({workspace:next.workspace,project_id:project.id,status:{$ne:'done'},archived:{$ne:true}},'sort_order',100);await base44.entities.Project.update(project.id,{next_action:open[0]?.title||'Review & finish'});window.dispatchEvent(new Event('pkos:project-changed'));}}catch{ /* Task acknowledgement remains valid; the next project read can refresh its plan. */ }}
  return next;
}
export function actionSaved(message, options = {}) {
  window.dispatchEvent(new CustomEvent('pkos:action-success', { detail: { message, ...options } }));
}
