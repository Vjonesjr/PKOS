import { base44 } from "@/api/base44Client";

const ENTITY_ORDER = ["Project", "Knowledge", "Decision", "Capture", "LearningItem", "Lesson", "Task", "Flashcard", "Link", "ReviewEntry"];

export async function buildBackup(workspace) {
  const data = {};
  for (const name of ENTITY_ORDER) {
    data[name] = await base44.entities[name].filter({ workspace }, "-created_date", 5000);
  }
  return {
    app: "Smart PKOS",
    version: 1,
    exported_at: new Date().toISOString(),
    workspace,
    data,
  };
}

export function downloadJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  triggerDownload(blob, filename);
}

export function downloadCSV(rows, columns, filename) {
  const escape = (v) => {
    if (v === null || v === undefined) return "";
    const s = Array.isArray(v) ? v.join("; ") : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const header = columns.map((c) => escape(c.label)).join(",");
  const lines = rows.map((r) => columns.map((c) => escape(r[c.key])).join(","));
  const csv = [header, ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  triggerDownload(blob, filename);
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Foreign-key fields per entity, and which entity each field references.
const FK_FIELDS = {
  Knowledge: ["project_id"],
  Decision: ["project_id"],
  Capture: ["project_id", "knowledge_id"],
  LearningItem: ["project_id", "knowledge_id"],
  Lesson: ["project_id", "decision_id", "knowledge_id"],
  Task: ["project_id", "source_capture_id"],
  Flashcard: ["knowledge_id", "learning_item_id"],
};

const FK_TARGET_ENTITY = {
  project_id: "Project",
  knowledge_id: "Knowledge",
  decision_id: "Decision",
  source_capture_id: "Capture",
  learning_item_id: "LearningItem",
};

// Link.source_type / target_type values used across the app -> entity name.
const LINK_TYPE_TO_ENTITY = {
  capture: "Capture",
  knowledge: "Knowledge",
  project: "Project",
  task: "Task",
  decision: "Decision",
  lesson: "Lesson",
  learning: "LearningItem",
};

// Order that respects foreign-key dependencies (referenced entities created first).
const RESTORE_ORDER = ["Project", "Knowledge", "Decision", "Capture", "LearningItem", "Lesson", "Task", "Flashcard"];

function stripBuiltins(record) {
  const { id, created_date, updated_date, created_by_id, ...rest } = record;
  return rest;
}

// Restore is additive-only: every record is created fresh with a new id, and
// foreign keys are remapped to the newly created ids. Existing records are
// never read, updated, or deleted, so nothing already saved can be overwritten.
export async function restoreBackup(backup, targetWorkspace) {
  const data = backup?.data || {};
  const idMaps = {};
  const summary = {};

  for (const entityName of RESTORE_ORDER) {
    const records = data[entityName] || [];
    idMaps[entityName] = {};
    for (const record of records) {
      const clean = stripBuiltins(record);
      clean.workspace = targetWorkspace;
      for (const fk of FK_FIELDS[entityName] || []) {
        if (clean[fk]) {
          const refEntity = FK_TARGET_ENTITY[fk];
          clean[fk] = idMaps[refEntity]?.[clean[fk]] || undefined;
        }
      }
      const created = await base44.entities[entityName].create(clean);
      idMaps[entityName][record.id] = created.id;
    }
    summary[entityName] = records.length;
  }

  const links = data.Link || [];
  let linkCount = 0;
  for (const link of links) {
    const sourceEntity = LINK_TYPE_TO_ENTITY[link.source_type];
    const targetEntity = LINK_TYPE_TO_ENTITY[link.target_type];
    const newSourceId = sourceEntity ? idMaps[sourceEntity]?.[link.source_id] : null;
    const newTargetId = targetEntity ? idMaps[targetEntity]?.[link.target_id] : null;
    if (!newSourceId || !newTargetId) continue;
    const clean = stripBuiltins(link);
    clean.workspace = targetWorkspace;
    clean.source_id = newSourceId;
    clean.target_id = newTargetId;
    await base44.entities.Link.create(clean);
    linkCount++;
  }
  summary.Link = linkCount;

  const reviewEntries = data.ReviewEntry || [];
  for (const entry of reviewEntries) {
    const clean = stripBuiltins(entry);
    clean.workspace = targetWorkspace;
    await base44.entities.ReviewEntry.create(clean);
  }
  summary.ReviewEntry = reviewEntries.length;

  return summary;
}