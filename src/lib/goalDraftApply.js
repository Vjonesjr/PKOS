import { base44 } from "@/api/base44Client";
import { format } from "date-fns";

/**
 * Persist an approved AI goal draft. Order: goal → new records → links.
 * Returns { goal, failed: string[] } so the UI can report partial failures.
 */
export async function applyGoalDraft(draft, picks, workspace) {
  const { goal: g, key_results } = draft;
  const goal = await base44.entities.Goal.create({
    ...g,
    target_date: g.target_date || null,
    status: "Active",
    progress_mode: key_results.length ? "key_results" : "rollup",
    key_results,
    workspace,
  });

  const failed = [];
  const run = async (label, fn) => { try { await fn(); } catch { failed.push(label); } };
  const today = format(new Date(), "yyyy-MM-dd");

  const newProjects = draft.new_projects.filter((_, i) => picks.newProjects.has(i));
  const newHabits = draft.new_habits.filter((_, i) => picks.newHabits.has(i));
  const linkP = draft.link_projects.filter((p) => picks.linkProjects.has(p.id));
  const linkH = draft.link_habits.filter((h) => picks.linkHabits.has(h.id));

  let created = [];
  if (newProjects.length) await run("new projects", async () => { created = await base44.entities.Project.bulkCreate(
    newProjects.map((p) => ({ title: p.title, next_action: p.next_action || "", status: "Planned", goal_id: goal.id, workspace }))); });
  // Approved tasks belong to the goal, and to the new project when exactly one was created.
  const newTasks = draft.suggested_tasks.filter((_, i) => picks.newTasks.has(i));
  const projectId = created.length === 1 ? created[0].id : undefined;
  if (newTasks.length) await run("tasks", () => base44.entities.Task.bulkCreate(
    newTasks.map((title) => ({ title, goal_id: goal.id, ...(projectId ? { project_id: projectId } : {}), workspace }))));
  if (newHabits.length) await run("new habits", () => base44.entities.Habit.bulkCreate(
    newHabits.map((h) => ({ title: h.title, schedule_type: h.schedule_type || "daily", weekdays: [1, 2, 3, 4, 5], per_week_target: h.per_week_target || 3, active: true, start_date: today, goal_id: goal.id, workspace }))));
  if (linkP.length) await run("project links", () => base44.entities.Project.bulkUpdate(linkP.map((p) => ({ id: p.id, goal_id: goal.id }))));
  if (linkH.length) await run("habit links", () => base44.entities.Habit.bulkUpdate(linkH.map((h) => ({ id: h.id, goal_id: goal.id }))));

  return { goal, failed };
}