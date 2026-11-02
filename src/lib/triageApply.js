import {convertCapture} from "@/lib/mvp/conversion";
import { base44 } from "@/api/base44Client";

export const TRIAGE_ACTIONS = {
  keep: "Keep as Capture",
  knowledge: "Convert to Artifact",
  project: "Convert to Project (Later)",
  task: "Convert to Task",
  learning: "Convert to Learning Item",
  decision: "Convert to Decision",
  lesson: "Convert to Lesson",
  archive: "Archive",
};

const mergeTags = (capture, s) => [...new Set([...(capture.tags || []), ...(s.tags || [])])];
// Never change an existing project assignment — only fill it when empty.
const resolveProject = (capture, s) => capture.project_id || s.project_id || "";

export function describeChanges(capture, s, projects) {
  const changes = [TRIAGE_ACTIONS[s.action]];
  const title = s.title || capture.title;
  if (!["keep", "archive"].includes(s.action) && title) changes.push(`New ${s.action === "learning" ? "learning item" : s.action}: "${title}"`);
  const newTags = (s.tags || []).filter((t) => !(capture.tags || []).includes(t));
  if (newTags.length) changes.push(`Add tags: ${newTags.map((t) => `#${t}`).join(" ")}`);
  if (!capture.project_id && s.project_id) changes.push(`Connect to project: ${projects.find((p) => p.id === s.project_id)?.title || "Unknown"}`);
  if (s.task_title && s.action !== "task" && s.action !== "archive") changes.push(`Create follow-up task: "${s.task_title}"`);
  (s.related || []).forEach((r) => changes.push(`Link to ${r.type}: ${r.title}`));
  return changes;
}

export async function applySuggestion(capture, s) {
  const workspace = capture.workspace;
  const tags = mergeTags(capture, s);
  const project_id = resolveProject(capture, s);
  const withProject = project_id ? { project_id } : {};
  const title = s.title || capture.title || (capture.content || "").slice(0, 80);
  const content = capture.content || "";

  let source = { type: "capture", id: capture.id };
  const creators = {
    knowledge: () => base44.entities.Knowledge.create({ title, content, tags, ...withProject, workspace }),
    task: () => base44.entities.Task.create({ title, description: content, source_capture_id: capture.id, ...withProject, workspace }),
    learning: () => base44.entities.LearningItem.create({ title, content, ...withProject, workspace }),
    decision: () => base44.entities.Decision.create({ title, decision: content || title, ...withProject, workspace }),
    lesson: () => base44.entities.Lesson.create({ title, learned: content || title, ...withProject, workspace }),
  };

  if (["knowledge","task","project"].includes(s.action)) {
    const rec=await convertCapture(capture,s.action,{title,project_id});
    source={type:rec.type,id:rec.id};
  } else if (creators[s.action]) {
    const rec = await creators[s.action]();
    source = { type: s.action, id: rec.id };
    await base44.entities.Capture.update(capture.id, { status: "processed", converted_to_type: s.action, converted_to_id: rec.id, tags, ...withProject });
  } else if (s.action === "archive") {
    await base44.entities.Capture.update(capture.id, { status: "archived", tags });
  } else {
    await base44.entities.Capture.update(capture.id, { tags, ...withProject, ...(capture.title ? {} : { title }) });
  }

  if (s.task_title && s.action !== "task" && s.action !== "archive") {
    await base44.entities.Task.create({ title: s.task_title, source_capture_id: capture.id, ...withProject, workspace });
  }

  for (const r of s.related || []) {
    await base44.entities.Link.create({ source_type: source.type, source_id: source.id, target_type: r.type, target_id: r.id, label: "AI suggested", workspace });
  }
}