import { base44 } from "@/api/base44Client";

// Destinations a user can send document content to.
export const DESTINATIONS = [
  { value: "capture", label: "Inbox (triage later)" },
  { value: "knowledge", label: "Knowledge" },
  { value: "learning", label: "Learning" },
  { value: "task", label: "Task" },
  { value: "decision", label: "Decision" },
  { value: "lesson", label: "Lesson" },
  { value: "project_reference", label: "Project reference", needsProject: true },
];

// Map AI suggestion types to a default destination.
export const defaultDestination = (type) =>
  ({ task: "task", knowledge: "knowledge", decision: "decision", lesson: "lesson", learning: "learning" }[type] || "capture");

// Link types used by the shared relationship system.
const LINK_TYPE = { capture: "capture", knowledge: "knowledge", learning: "learning", task: "task", decision: "decision", lesson: "lesson" };

const sourceNote = (doc) => `Imported from ${doc.file_name} on ${new Date().toISOString().slice(0, 10)}`;

// Create the processed record and link it back to its original document.
export async function createFromDocument(dest, { title, content, project_id, doc }) {
  const E = base44.entities;
  const base = { project_id: project_id || undefined, workspace: doc.workspace };
  const tags = doc.tags || [];

  if (dest === "project_reference") {
    const project = await E.Project.get(project_id);
    const url = `/documents?doc=${doc.id}`;
    const refs = project.references || [];
    if (!refs.some((r) => r.url === url)) await E.Project.update(project.id, { references: [...refs, { title, url }] });
    return { id: project.id };
  }

  const footer = `\n\n— ${sourceNote(doc)}`;
  let rec;
  if (dest === "knowledge") rec = await E.Knowledge.create({ ...base, title, content, tags, type: "reference", source: sourceNote(doc) });
  else if (dest === "task") rec = await E.Task.create({ ...base, title, description: content + footer });
  else if (dest === "decision") rec = await E.Decision.create({ ...base, title, decision: title, context: content + footer, date: new Date().toISOString().slice(0, 10) });
  else if (dest === "lesson") rec = await E.Lesson.create({ ...base, title, what_happened: content + footer, learned: content || title });
  else if (dest === "learning") rec = await E.LearningItem.create({ ...base, title, content: content + footer, type: "resource" });
  else rec = await E.Capture.create({ ...base, title, content: (content || title) + footer, tags, type: "reference" });

  await E.Link.create({ source_type: "document", source_id: doc.id, target_type: LINK_TYPE[dest], target_id: rec.id, label: "Imported from", workspace: doc.workspace });
  return rec;
}