// Defines search scope, per-type searchable text, and display order for Universal Search.
export const SEARCH_TYPES = ["knowledge", "project", "task", "learning", "decision", "lesson", "capture"];

export const SEARCH_TYPE_LABELS = {
  capture: "Captures",
  knowledge: "Knowledge",
  project: "Projects",
  task: "Tasks",
  learning: "Learning",
  decision: "Decisions",
  lesson: "Lessons",
};

// Builds the flat text blob a query is matched against for a given record type.
export function getSearchText(type, record) {
  switch (type) {
    case "capture":
      return [record.title, record.content, ...(record.tags || [])].join(" ");
    case "knowledge":
      return [record.title, record.content, record.category, ...(record.tags || [])].join(" ");
    case "project":
      return [record.title, record.description, record.next_action, record.blockers].join(" ");
    case "task":
      return [record.title, record.description].join(" ");
    case "learning":
      return [record.title, record.content].join(" ");
    case "decision":
      return [record.decision, record.context, record.alternatives, record.reasoning].join(" ");
    case "lesson":
      return [record.title, record.what_happened, record.what_worked, record.what_didnt, record.learned, record.next_time].join(" ");
    default:
      return "";
  }
}

export function getTitle(type, record) {
  if (type === "decision") return record.decision || "Untitled decision";
  return record.title || "Untitled";
}

export function getSnippet(type, record) {
  switch (type) {
    case "capture":
    case "knowledge":
    case "learning":
      return record.content || "";
    case "project":
      return record.description || record.next_action || "";
    case "task":
      return record.description || "";
    case "decision":
      return record.context || record.reasoning || "";
    case "lesson":
      return record.learned || record.what_happened || "";
    default:
      return "";
  }
}

export function getRoute(type, record) {
  switch (type) {
    case "knowledge":
      return `/knowledge-detail?id=${record.id}`;
    case "project":
      return `/project-detail?id=${record.id}`;
    case "task":
      return "/projects";
    case "learning":
      return "/learning";
    case "decision":
      return `/decision-detail?id=${record.id}`;
    case "lesson":
      return `/lesson-detail?id=${record.id}`;
    case "capture":
    default:
      return "/capture";
  }
}