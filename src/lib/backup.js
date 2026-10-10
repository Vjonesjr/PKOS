import { base44 } from "@/api/base44Client";

const ENTITY_ORDER = [
  "Project", "Knowledge", "Decision", "Capture", "LearningItem", "Lesson", "Task", "Flashcard",
  "Link", "ReviewEntry", "ContextPack", "Tool", "Device", "AutomationRecipe", "AutomationRun",
  "Goal", "Habit", "HabitLog", "GoalCheckin",
];

export async function buildBackup(workspace) {
  const data = {};
  for (const name of ENTITY_ORDER) {
    data[name] = await base44.entities[name].filter({ workspace }, "-created_date", 5000);
  }
  return {
    app: "Smart PKOS",
    version: 2,
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
  Project: ["goal_id"],
  Habit: ["goal_id"],
  HabitLog: ["habit_id"],
  GoalCheckin: ["goal_id"],
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
  goal_id: "Goal",
  habit_id: "Habit",
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
  review: "ReviewEntry",
};

// Order that respects foreign-key dependencies (referenced entities created first).
const RESTORE_ORDER = ["Goal", "Project", "Knowledge", "Decision", "Capture", "LearningItem", "Lesson", "Task", "Flashcard", "Habit", "HabitLog", "GoalCheckin"];

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
  idMaps.ReviewEntry = {};
  for (const entry of reviewEntries) {
    const clean = stripBuiltins(entry);
    clean.workspace = targetWorkspace;
    const created = await base44.entities.ReviewEntry.create(clean);
    idMaps.ReviewEntry[entry.id] = created.id;
  }
  summary.ReviewEntry = reviewEntries.length;

  // Newer PKOS systems are also part of a "full backup".
  for (const entityName of ["Tool", "Device"]) {
    const records = data[entityName] || [];
    idMaps[entityName] = {};
    for (const record of records) {
      const clean = stripBuiltins(record);
      clean.workspace = targetWorkspace;
      const created = await base44.entities[entityName].create(clean);
      idMaps[entityName][record.id] = created.id;
    }
    summary[entityName] = records.length;
  }

  const packs = data.ContextPack || [];
  idMaps.ContextPack = {};
  for (const pack of packs) {
    const clean = stripBuiltins(pack);
    clean.workspace = targetWorkspace;
    clean.items = (clean.items || [])
      .map((item) => {
        const entityName = LINK_TYPE_TO_ENTITY[item.type];
        const mappedId = entityName ? idMaps[entityName]?.[item.id] : null;
        return mappedId ? { ...item, id: mappedId } : null;
      })
      .filter(Boolean);
    const created = await base44.entities.ContextPack.create(clean);
    idMaps.ContextPack[pack.id] = created.id;
  }
  summary.ContextPack = packs.length;

  const recipes = data.AutomationRecipe || [];
  idMaps.AutomationRecipe = {};
  for (const recipe of recipes) {
    const clean = stripBuiltins(recipe);
    clean.workspace = targetWorkspace;
    clean.conditions = (clean.conditions || []).map((condition) =>
      condition.field === "project" && condition.value
        ? { ...condition, value: idMaps.Project?.[condition.value] || "" }
        : condition
    );
    if (clean.action_params?.project_id) {
      clean.action_params = {
        ...clean.action_params,
        project_id: idMaps.Project?.[clean.action_params.project_id] || "",
      };
    }
    if (clean.action_params?.target_id && clean.action_params?.target_type) {
      const targetEntity = LINK_TYPE_TO_ENTITY[clean.action_params.target_type];
      clean.action_params = {
        ...clean.action_params,
        target_id: targetEntity ? idMaps[targetEntity]?.[clean.action_params.target_id] || "" : "",
      };
    }
    const created = await base44.entities.AutomationRecipe.create(clean);
    idMaps.AutomationRecipe[recipe.id] = created.id;
  }
  summary.AutomationRecipe = recipes.length;

  const runs = data.AutomationRun || [];
  let restoredRuns = 0;
  for (const run of runs) {
    const recipeId = idMaps.AutomationRecipe?.[run.recipe_id];
    if (!recipeId) continue;
    const clean = stripBuiltins(run);
    clean.workspace = targetWorkspace;
    clean.recipe_id = recipeId;
    const recordEntity = LINK_TYPE_TO_ENTITY[clean.record_type];
    if (clean.record_id && recordEntity) {
      clean.record_id = idMaps[recordEntity]?.[clean.record_id] || "";
    }
    await base44.entities.AutomationRun.create(clean);
    restoredRuns++;
  }
  summary.AutomationRun = restoredRuns;

  return summary;
}