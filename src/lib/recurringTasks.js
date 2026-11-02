import { base44 } from "@/api/base44Client";

const DAY_MS = 86400000;
const pad = (n) => String(n).padStart(2, "0");
const dateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const timeParts = (value) => {
  const [h, m] = String(value || "09:00").split(":").map(Number);
  return [Number.isFinite(h) ? h : 9, Number.isFinite(m) ? m : 0];
};
const atLocalTime = (date, time) => {
  const next = new Date(date);
  const [h, m] = timeParts(time);
  next.setHours(h, m, 0, 0);
  return next;
};
const addDaysLocal = (date, count) => {
  const next = new Date(date);
  next.setDate(next.getDate() + count);
  return next;
};
const addMonthsLocal = (date, count, dayOfMonth) => {
  const next = new Date(date);
  next.setDate(1);
  next.setMonth(next.getMonth() + count);
  const last = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(dayOfMonth || date.getDate(), last));
  return next;
};
const rows = (result) => Array.isArray(result) ? result : result?.items || [];

export function buildInitialOccurrence(template) {
  const base = template.start_date ? new Date(`${template.start_date}T12:00:00`) : new Date();
  let next = atLocalTime(base, template.time_of_day);
  const now = new Date();
  if (next < now && !template.start_date) next = atLocalTime(now, template.time_of_day);
  if (template.schedule_type === "weekdays") {
    while ([0, 6].includes(next.getDay())) next = addDaysLocal(next, 1);
  }
  if (template.schedule_type === "weekly" && template.weekdays?.length) {
    const allowed = new Set(template.weekdays.map(Number));
    for (let i = 0; i < 7 && !allowed.has(next.getDay()); i++) next = addDaysLocal(next, 1);
  }
  if (template.schedule_type === "monthly" && template.day_of_month) {
    const day = Number(template.day_of_month);
    const last = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(day, last));
    if (next < now && !template.start_date) next = addMonthsLocal(next, 1, day);
  }
  return next.toISOString();
}

export function nextOccurrence(template, anchorIso, completedIso) {
  const anchor = new Date(template.schedule_type === "after_completion" ? (completedIso || new Date().toISOString()) : anchorIso);
  let next;
  switch (template.schedule_type) {
    case "daily": next = addDaysLocal(anchor, 1); break;
    case "weekdays": {
      next = addDaysLocal(anchor, 1);
      while ([0, 6].includes(next.getDay())) next = addDaysLocal(next, 1);
      break;
    }
    case "weekly": {
      const allowed = template.weekdays?.length ? new Set(template.weekdays.map(Number)) : null;
      if (!allowed) next = addDaysLocal(anchor, 7);
      else {
        next = addDaysLocal(anchor, 1);
        for (let i = 0; i < 7 && !allowed.has(next.getDay()); i++) next = addDaysLocal(next, 1);
      }
      break;
    }
    case "monthly": next = addMonthsLocal(anchor, 1, Number(template.day_of_month) || anchor.getDate()); break;
    case "interval_days": next = addDaysLocal(anchor, Math.max(1, Number(template.interval_value) || 1)); break;
    case "after_completion": next = addDaysLocal(anchor, Math.max(1, Number(template.interval_value) || 1)); break;
    default: next = addDaysLocal(anchor, 7);
  }
  return atLocalTime(next, template.time_of_day).toISOString();
}

export function recurringLabel(template) {
  if (!template) return "Repeating";
  const n = Math.max(1, Number(template.interval_value) || 1);
  if (template.schedule_type === "daily") return "Daily";
  if (template.schedule_type === "weekdays") return "Weekdays";
  if (template.schedule_type === "weekly") return template.weekdays?.length > 1 ? "Selected weekdays" : "Weekly";
  if (template.schedule_type === "monthly") return `Monthly${template.day_of_month ? ` on day ${template.day_of_month}` : ""}`;
  if (template.schedule_type === "interval_days") return `Every ${n} day${n === 1 ? "" : "s"}`;
  if (template.schedule_type === "after_completion") return `${n} day${n === 1 ? "" : "s"} after completion`;
  return "Repeating";
}

export async function createRecurringOccurrence(template) {
  if (!template?.active) return null;
  const scheduled = template.next_occurrence_at || buildInitialOccurrence(template);
  const due = dateKey(new Date(scheduled));
  if (template.end_date && due > template.end_date) {
    await base44.entities.RecurringTask.update(template.id, { active: false });
    return null;
  }
  const occurrenceKey = `${template.id}|${scheduled.slice(0, 16)}`;
  const existing = rows(await base44.entities.Task.filter({ workspace: template.workspace, occurrence_key: occurrenceKey }, { limit: 2 }));
  if (existing[0]) return existing[0];
  const today = dateKey(new Date());
  const task = await base44.entities.Task.create({
    title: template.title,
    description: template.description || "",
    status: "todo",
    priority: template.default_priority || "medium",
    effort: template.effort || undefined,
    contexts: template.contexts || [],
    project_id: template.project_id || null,
    goal_id: template.goal_id || null,
    due_date: due,
    today_date: due === today ? due : null,
    scheduled_time: template.time_of_day || null,
    scheduled_for: scheduled,
    recurrence_template_id: template.id,
    occurrence_key: occurrenceKey,
    recurrence_outcome: "generated",
    ai_subtask_level: template.ai_subtask_level || "detailed",
    workspace: template.workspace,
  });
  const seen = new Set();
  for (const raw of template.saved_subtasks || []) {
    const title = String(raw || "").trim();
    const key = title.toLowerCase();
    if (!title || seen.has(key)) continue;
    seen.add(key);
    await base44.entities.Task.create({ title, parent_task_id: task.id, project_id: template.project_id || null, goal_id: template.goal_id || null, status: "todo", priority: template.default_priority || "medium", workspace: template.workspace });
  }
  await base44.entities.RecurringTask.update(template.id, { next_occurrence_at: scheduled, last_generated_at: new Date().toISOString() });
  window.dispatchEvent(new CustomEvent("pkos:task-saved", { detail: { task } }));
  return task;
}

export async function ensureRecurringOccurrences(workspace, horizonDays = 14) {
  const templates = rows(await base44.entities.RecurringTask.filter({ workspace, active: true }, { sort: "next_occurrence_at", limit: 500 }));
  const horizon = Date.now() + horizonDays * DAY_MS;
  for (const template of templates) {
    let nextAt = template.next_occurrence_at;
    if (!nextAt) {
      nextAt = buildInitialOccurrence(template);
      await base44.entities.RecurringTask.update(template.id, { next_occurrence_at: nextAt });
      template.next_occurrence_at = nextAt;
    }
    if (Date.parse(nextAt) > horizon) continue;
    const open = rows(await base44.entities.Task.filter({ workspace, recurrence_template_id: template.id, archived: { $ne: true }, status: { $ne: "done" } }, { limit: 5 }));
    if (!open.length) await createRecurringOccurrence(template);
  }
}

export async function advanceRecurringOccurrence(task, outcome = "completed") {
  if (!task?.recurrence_template_id) return null;
  const template = await base44.entities.RecurringTask.get(task.recurrence_template_id).catch(() => null);
  if (!template || !template.active) return null;
  const completedIso = new Date().toISOString();
  const anchor = task.scheduled_for || template.next_occurrence_at || completedIso;
  const nextAt = nextOccurrence(template, anchor, completedIso);
  const patch = {
    next_occurrence_at: nextAt,
    ...(outcome === "completed" ? { last_completed_at: completedIso } : {}),
  };
  await base44.entities.RecurringTask.update(template.id, patch);
  const nextTemplate = { ...template, ...patch };
  if (Date.parse(nextAt) <= Date.now() + 14 * DAY_MS) return createRecurringOccurrence(nextTemplate);
  return null;
}

export async function skipRecurringOccurrence(task) {
  if (!task?.recurrence_template_id) return null;
  const saved = await base44.entities.Task.update(task.id, { archived: true, recurrence_outcome: "skipped" });
  await advanceRecurringOccurrence({ ...task, ...saved }, "skipped");
  window.dispatchEvent(new CustomEvent("pkos:task-saved", { detail: { task: { ...task, ...saved } } }));
  return saved;
}

export async function snoozeRecurringOccurrence(task, days = 1) {
  if (!task?.recurrence_template_id) return null;
  const base = task.scheduled_for ? new Date(task.scheduled_for) : new Date();
  const next = addDaysLocal(base, Math.max(1, Number(days) || 1));
  const due = dateKey(next);
  const today = dateKey(new Date());
  const saved = await base44.entities.Task.update(task.id, { scheduled_for: next.toISOString(), due_date: due, today_date: due === today ? due : null });
  window.dispatchEvent(new CustomEvent("pkos:task-saved", { detail: { task: { ...task, ...saved } } }));
  return saved;
}
