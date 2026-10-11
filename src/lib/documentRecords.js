import { base44 } from "@/api/base44Client";

// Destinations a user can send document content to.
export const DESTINATIONS = [
  { value: "capture", label: "Inbox (triage later)" },
  { value: "knowledge", label: "Knowledge" },
  { value: "task", label: "Task" },
  { value: "decision", label: "Decision" },
  { value: "lesson", label: "Lesson" },
  { value: "learning", label: "Learning" },
];

// Map AI suggestion types to a default destination.
export const defaultDestination = (type) =>
  ({ task: "task", knowledge: "knowledge", decision: "decision", lesson: "lesson", learning: "learning" }[type] || "capture");

export async function createFromDocument(dest, { title, content, project_id, tags, workspace }) {
  const base = { project_id: project_id || undefined, workspace };
  const E = base44.entities;
  if (dest === "knowledge") return E.Knowledge.create({ ...base, title, content, tags, type: "reference" });
  if (dest === "task") return E.Task.create({ ...base, title, description: content });
  if (dest === "decision") return E.Decision.create({ ...base, title, decision: title, context: content, date: new Date().toISOString().slice(0, 10) });
  if (dest === "lesson") return E.Lesson.create({ ...base, title, what_happened: content, learned: content || title });
  if (dest === "learning") return E.LearningItem.create({ ...base, title, content, type: "resource" });
  return E.Capture.create({ ...base, title, content: content || title, tags, type: "reference" });
}