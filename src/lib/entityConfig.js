import { base44 } from "@/api/base44Client";

// Central registry mapping a record "type" key to its entity, label, color and route.
export const ENTITY_CONFIG = {
  capture: { label: "Capture", entity: base44.entities.Capture, color: "text-cyan-400", bg: "bg-cyan-400/10", route: "/capture" },
  knowledge: { label: "Knowledge", entity: base44.entities.Knowledge, color: "text-sky-400", bg: "bg-sky-400/10", route: "/knowledge-detail", detail: true },
  project: { label: "Project", entity: base44.entities.Project, color: "text-violet-400", bg: "bg-violet-400/10", route: "/project-detail", detail: true },
  task: { label: "Task", entity: base44.entities.Task, color: "text-emerald-400", bg: "bg-emerald-400/10", route: "/task-detail", detail: true },
  decision: { label: "Decision", entity: base44.entities.Decision, color: "text-amber-400", bg: "bg-amber-400/10", route: "/decision-detail", detail: true },
  lesson: { label: "Lesson", entity: base44.entities.Lesson, color: "text-rose-400", bg: "bg-rose-400/10", route: "/lesson-detail", detail: true },
  learning: { label: "Learning", entity: base44.entities.LearningItem, color: "text-pink-400", bg: "bg-pink-400/10", route: "/learning", detail: true },
};

export function titleField(type) {
  return type === "decision" ? "decision" : type === "lesson" ? "learned" : "title";
}

export async function fetchRecord(type, id) {
  const cfg = ENTITY_CONFIG[type];
  if (!cfg || !id) return null;
  try {
    return await cfg.entity.get(id);
  } catch {
    return null;
  }
}

export function recordLabel(type, record) {
  if (!record) return "Untitled";
  return record.title || record[titleField(type)] || "Untitled";
}