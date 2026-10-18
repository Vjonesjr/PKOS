// Sorting and grouping rules for the home task queue. Pure functions, no I/O.
import { differenceInCalendarDays, parseISO } from "date-fns";

export const STATUSES = [["todo", "To do"], ["in_progress", "In progress"], ["waiting", "Waiting"], ["done", "Complete"]];
export const EFFORTS = [["quick", "Quick"], ["medium", "Medium"], ["deep", "Deep focus"]];
export const CONTEXTS = [["mobile", "Phone"], ["computer", "Computer"], ["app", "Specific app"], ["errand", "Errand"], ["home", "At home"], ["calls", "Calls"]];
export const SORTS = [["manual", "My order"], ["due", "Due date"], ["priority", "Priority"], ["effort", "Effort (quick first)"], ["fun", "Most fun"]];
export const GROUPS = [["none", "No grouping"], ["context", "Where I can do it"], ["effort", "Effort"], ["due", "Deadline"], ["project", "Project"], ["status", "Status"]];

const PRI = { high: 0, medium: 1, low: 2 };
const EFF = { quick: 0, medium: 1, deep: 2 };
const due = (t) => t.due_date || "9999-12-31";

export const manualOrder = (a, b) => (a.sort_order ?? Infinity) - (b.sort_order ?? Infinity) || (b.created_date || "").localeCompare(a.created_date || "");

const COMPARE = {
  manual: manualOrder,
  due: (a, b) => due(a).localeCompare(due(b)),
  priority: (a, b) => (PRI[a.priority] ?? 1) - (PRI[b.priority] ?? 1),
  effort: (a, b) => (EFF[a.effort] ?? 1) - (EFF[b.effort] ?? 1),
  fun: (a, b) => (b.fun ?? 0) - (a.fun ?? 0),
};
// Ties fall back to the user's manual order so dragging still matters in other sorts.
export const sortTasks = (tasks, mode) => [...tasks].sort((a, b) => COMPARE[mode](a, b) || manualOrder(a, b));

const dueBucket = (t) => {
  if (!t.due_date) return "No deadline";
  const d = differenceInCalendarDays(parseISO(t.due_date), new Date());
  return d < 0 ? "Overdue" : d === 0 ? "Today" : d <= 7 ? "This week" : "Later";
};
const label = (pairs, v, fallback) => pairs.find(([k]) => k === v)?.[1] || fallback;

// Groupings where dropping a task into another group can safely rewrite one field.
export const MOVABLE_GROUPS = ["context", "effort", "status"];

/**
 * Returns [{name, value, tasks}]. `value` is the field value the group represents ("" = unset).
 * A task with several contexts appears in each matching group.
 */
export function groupTasks(tasks, by, projectNames) {
  if (by === "none") return [{ name: "", value: "", tasks }];
  const map = new Map();
  const add = (name, value, t) => {
    if (!map.has(name)) map.set(name, { name, value, tasks: [] });
    map.get(name).tasks.push(t);
  };
  tasks.forEach((t) => {
    if (by === "context") (t.contexts?.length ? t.contexts : [""]).forEach((c) => add(c ? label(CONTEXTS, c, c) : "Anywhere / unset", c, t));
    else if (by === "effort") add(label(EFFORTS, t.effort, "Effort not set"), t.effort || "", t);
    else if (by === "due") add(dueBucket(t), "", t);
    else if (by === "project") add(projectNames[t.project_id] || "No project", t.project_id || "", t);
    else add(label(STATUSES, t.status, "To do"), t.status || "todo", t);
  });
  // Show every option for movable groupings so tasks can be dropped into empty groups too.
  const all = { context: [...CONTEXTS, ["", "Anywhere / unset"]], effort: [...EFFORTS, ["", "Effort not set"]], status: STATUSES }[by];
  all?.forEach(([v, l]) => !map.has(l) && map.set(l, { name: l, value: v, tasks: [] }));
  const order = all?.map(([, l]) => l);
  return [...map.values()].sort((a, b) => (order ? order.indexOf(a.name) - order.indexOf(b.name) : 0));
}

/** Field patch for moving a task from one group to another. */
export function groupMovePatch(by, task, fromValue, toValue) {
  if (by === "effort") return { effort: toValue || null };
  if (by === "context") {
    const rest = (task.contexts || []).filter((c) => c !== fromValue && c !== toValue);
    return { contexts: toValue ? [...rest, toValue] : rest };
  }
  return null; // status is handled by the caller (completion side effects)
}