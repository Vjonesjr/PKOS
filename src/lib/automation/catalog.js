import { base44 } from "@/api/base44Client";
import { ENTITY_CONFIG, recordLabel } from "@/lib/entityConfig";
import { getSearchText } from "@/lib/searchConfig";

export const today = () => new Date().toISOString().slice(0, 10);

// Record types automations can watch (reuses existing entities — nothing duplicated).
export const TYPES = {
  ...Object.fromEntries(Object.entries(ENTITY_CONFIG).map(([k, v]) => [k, { label: v.label, entity: v.entity }])),
  review: { label: "Review", entity: base44.entities.ReviewEntry },
  goal: { label: "Goal", entity: base44.entities.Goal },
  goal_checkin: { label: "Goal check-in", entity: base44.entities.GoalCheckin },
  habit: { label: "Habit", entity: base44.entities.Habit },
  habit_log: { label: "Habit check-in", entity: base44.entities.HabitLog },
};

const GOAL_TYPES = ["goal", "goal_checkin", "habit", "habit_log"];

export const recordTitle = (type, r) => {
  if (type === "review") return `${r.type} review · ${r.date}`;
  if (type === "goal_checkin") return `Goal check-in · week of ${r.week_start}`;
  if (type === "habit_log") return `Habit check-in · ${r.date}`;
  return recordLabel(type, r);
};

export function recordRoute(type, id, record) {
  if (type === "review") return "/review";
  if (GOAL_TYPES.includes(type)) return "/goals";
  const cfg = ENTITY_CONFIG[type];
  if (!cfg) return "/";
  if (cfg.detail) return `${cfg.route}?id=${id}`;
  if (type === "task" && record?.project_id) return `/project-detail?id=${record.project_id}`;
  return cfg.route;
}

const isOverdue = (r) => !!r.due_date && r.due_date < today() && r.status !== "done";

// event: "create" | "update" = detected live from record changes; "scan" = checked on app open and every 10 minutes.
export const TRIGGERS = {
  capture_created: { label: "A capture is created", types: ["capture"], event: "create" },
  task_created: { label: "A task is created", types: ["task"], event: "create" },
  task_completed: { label: "A task is completed", types: ["task"], event: "update", when: (r) => r.status === "done" },
  task_overdue: { label: "A task becomes overdue", types: ["task"], event: "scan", when: isOverdue },
  project_created: { label: "A project is created", types: ["project"], event: "create" },
  project_status_changed: { label: "A project's status changes", types: ["project"], event: "update" },
  project_updated: { label: "A project is updated", types: ["project"], event: "update" },
  knowledge_created: { label: "A knowledge item is created", types: ["knowledge"], event: "create" },
  decision_created: { label: "A decision is recorded", types: ["decision"], event: "create" },
  lesson_created: { label: "A lesson is recorded", types: ["lesson"], event: "create" },
  review_completed: { label: "A review is saved", types: ["review"], event: "create" },
  capture_or_knowledge_created: { label: "A capture or knowledge item is created", types: ["capture", "knowledge"], event: "create" },
  tag_added: { label: "A tag is added (capture or knowledge)", types: ["capture", "knowledge"], event: "update", when: (r) => (r.tags || []).length > 0 },
  record_updated: { label: "Any record is updated", types: ["capture", "knowledge", "project", "task", "decision", "lesson", "learning"], event: "update" },
  // Goal & habit lifecycle — evaluated immediately on record changes.
  goal_created: { label: "A goal is created", types: ["goal"], event: "create" },
  goal_status_changed: { label: "A goal's status changes", types: ["goal"], event: "update" },
  goal_checkin_saved: { label: "A weekly goal check-in is saved", types: ["goal_checkin"], event: "create" },
  habit_checked_in: { label: "A habit is checked in", types: ["habit_log"], event: "create", when: (r) => r.status === "done" },
  // Time-based — evaluated by the server's nightly check (00:30 New York time), even when the app is closed.
  goal_due_soon: { label: "A goal's target date is within 7 days", types: ["goal"], event: "nightly" },
  goal_checkin_missed: { label: "A goal has no weekly check-in (checked Sunday night)", types: ["goal"], event: "nightly" },
  habit_streak_broken: { label: "A habit streak breaks", types: ["habit"], event: "nightly" },
  habit_week_shortfall: { label: "A weekly habit falls short of its target", types: ["habit"], event: "nightly" },
};

export const MODES = { create: "Immediate", update: "Immediate", scan: "While app is open", nightly: "Nightly check" };
export const isNightly = (key) => TRIGGERS[key]?.event === "nightly";
// Conditions the nightly server check understands.
export const NIGHTLY_CONDITIONS = ["status", "text"];

export const CONDITIONS = {
  tag: { label: "Tag is", needsValue: true, test: (r, v) => (r.tags || []).some((t) => t.toLowerCase() === v.toLowerCase()) },
  text: { label: "Text contains", needsValue: true, test: (r, v, type) => textOf(type, r).toLowerCase().includes(v.toLowerCase()) },
  status: { label: "Status is", needsValue: true, test: (r, v) => String(r.status || "").toLowerCase() === v.toLowerCase() },
  priority: { label: "Priority is", needsValue: true, options: ["low", "medium", "high"], test: (r, v) => r.priority === v },
  type: { label: "Type is", needsValue: true, test: (r, v) => String(r.type || "").toLowerCase() === v.toLowerCase() },
  project: { label: "Belongs to project", needsValue: true, project: true, test: (r, v) => r.project_id === v },
  no_next_action: { label: "Has no next action", test: (r) => !r.next_action?.trim() },
  overdue: { label: "Is overdue", test: isOverdue },
};

function textOf(type, r) {
  if (type === "review") return [r.summary, r.content].join(" ");
  return getSearchText(type, r) || [r.title, r.content].join(" ");
}

export const matchesConditions = (recipe, type, r) =>
  (recipe.conditions || []).every((c) => CONDITIONS[c.field] && (!CONDITIONS[c.field].needsValue || c.value) && CONDITIONS[c.field].test(r, c.value || "", type));

export const matchesTrigger = (trigger, type, r) => !!trigger && trigger.types.includes(type) && (!trigger.when || trigger.when(r));