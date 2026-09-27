import { base44 } from "@/api/base44Client";

export const SUGGESTION_LABELS = {
  task: "Task",
  milestone: "Milestone",
  note: "Project Note",
  research_question: "Research Question",
  knowledge_link: "Knowledge Link",
  decision: "Decision to Make",
};

// Creates exactly one approved record; never edits existing content.
export async function applyCopilotSuggestion(project, s) {
  const workspace = project.workspace;
  const project_id = project.id;
  if (s.type === "task") return base44.entities.Task.create({ title: s.title, description: s.detail || "", project_id, workspace });
  if (s.type === "milestone") return base44.entities.Project.update(project_id, { milestones: [...(project.milestones || []), { title: s.title, done: false }] });
  if (s.type === "note") return base44.entities.Knowledge.create({ title: s.title, content: s.detail || "", project_id, workspace });
  if (s.type === "research_question") return base44.entities.Capture.create({ type: "question", title: s.title, content: s.detail || s.title, project_id, workspace });
  if (s.type === "decision") return base44.entities.Decision.create({ title: s.title, decision: s.detail || s.title, status: "pending", project_id, workspace });
  if (s.type === "knowledge_link")
    return base44.entities.Link.create({ source_type: "project", source_id: project_id, target_type: "knowledge", target_id: s.knowledge_id, label: "AI suggested", workspace });
}