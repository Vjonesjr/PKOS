import { base44 } from "@/api/base44Client";
import { format } from "date-fns";

// Hand-off key so any screen with long text can open Quick Parse prefilled.
export const PARSE_HANDOFF_KEY = "pkos_parse_text";

// Inline commands: /parse, /defer 2d, /focus 25, /sprint 10m. Anything else is plain text.
export function readCommands(raw) {
  const opts = {};
  const text = raw
    .replace(/^\s*\/parse\b/i, "")
    .replace(/\/defer\s+(\d+)d\b/i, (_, d) => { opts.deferDays = Number(d); return ""; })
    .replace(/\/(focus|sprint)\s+(\d+)m?\b/i, (_, __, m) => { opts.focusMinutes = Math.min(Number(m), 120); return ""; });
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
  if (i.anchor) lines.push(`Memory anchor: ${i.anchor}`);
  if (i.subtasks.length) lines.push("", "Subtasks:", ...i.subtasks.map((s) => `- [ ] ${s.title}${s.minutes ? ` (${s.minutes}m)` : ""}`));
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
    ...(i.time && !i.done ? { scheduled_time: i.time } : {}),
    ...(i.project_id || idFor[i.group] ? { project_id: i.project_id || idFor[i.group] } : {}),
    workspace,
  }));
  await base44.entities.Task.bulkCreate(tasks);
  // One-tap calendar sync reuses the existing push (open, dated tasks only).
  if (opts.syncCalendar) await base44.functions.invoke("pushToCalendar", { workspace, today });
  return { tasks: tasks.length, projects: created.length };
}

/** Download the reviewed parse as JSON or CSV (e.g. to share with a coach). */
export function exportParsed(items, kind) {
  const rows = items.filter((i) => i.include);
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const body = kind === "json" ? JSON.stringify(rows, null, 2) : [
    ["project", "title", "done", "due_date", "time", "priority", "estimate_minutes", "tags", "next_action", "subtasks"].join(","),
    ...rows.map((i) => [i.group, i.title, i.done, i.due_date, i.time, i.priority, i.estimate_minutes, i.tags.join(" "), i.next_action,
      i.subtasks.map((s) => `${s.title}${s.minutes ? ` (${s.minutes}m)` : ""}`).join("; ")].map(esc).join(",")),
  ].join("\n");
  const url = URL.createObjectURL(new Blob([body], { type: kind === "json" ? "application/json" : "text/csv" }));
  Object.assign(document.createElement("a"), { href: url, download: `parsed-tasks.${kind}` }).click();
  URL.revokeObjectURL(url);
}