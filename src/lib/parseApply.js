import { base44 } from "@/api/base44Client";
import { format } from "date-fns";

// Supported inline commands. Anything else is treated as plain text.
export function readCommands(raw) {
  let text = raw;
  const opts = {};
  text = text.replace(/^\s*\/parse\b/i, "");
  text = text.replace(/\/defer\s+(\d+)d\b/i, (_, d) => { opts.deferDays = Number(d); return ""; });
  return { text: text.trim(), opts };
}

const addDays = (n) => format(new Date(Date.now() + n * 864e5), "yyyy-MM-dd");

/** Builds a readable task description from the parsed extras. */
function describe(i) {
  const lines = [];
  if (i.next_action) lines.push(`Next action: ${i.next_action}`);
  if (i.time) lines.push(`Time: ${i.time}`);
  if (i.estimate_minutes) lines.push(`Estimate: ${i.estimate_minutes}m`);
  if (i.tags.length) lines.push(`Tags: ${i.tags.map((t) => `#${t}`).join(" ")}`);
  if (i.subtasks.length) lines.push("", "Subtasks:", ...i.subtasks.map((s) => `- [ ] ${s}`));
  if (i.chunks.length) lines.push("", "Focus chunks:", ...i.chunks.map((s) => `- [ ] ${s}`));
  return lines.join("\n");
}

/** Saves accepted items: creates missing projects (not "Inbox"), then tasks in one batch. */
export async function applyParsed(items, workspace, opts = {}) {
  const today = format(new Date(), "yyyy-MM-dd");
  const newGroups = [...new Set(items.filter((i) => !i.project_id && i.group !== "Inbox").map((i) => i.group))];
  const created = newGroups.length
    ? await base44.entities.Project.bulkCreate(newGroups.map((title) => ({ title, status: "Active", workspace })))
    : [];
  const idFor = Object.fromEntries(created.map((p) => [p.title, p.id]));
  const tasks = items.map((i) => ({
    title: i.title,
    description: describe(i),
    status: i.done ? "done" : "todo",
    priority: i.priority,
    ...(i.done ? { completed_date: today } : {}),
    ...(opts.deferDays && !i.done ? { due_date: addDays(opts.deferDays) } : i.due_date ? { due_date: i.due_date } : {}),
    ...(i.project_id || idFor[i.group] ? { project_id: i.project_id || idFor[i.group] } : {}),
    workspace,
  }));
  await base44.entities.Task.bulkCreate(tasks);
  return { tasks: tasks.length, projects: created.length };
}