// Builds server-side search queries so filtering happens in the database, not in the browser.
import { base44 } from "@/api/base44Client";

export const PAGE_SIZE = 20;

export const SEARCH_ENTITIES = {
  capture: { entity: "Capture", sort: "-created_date", fields: ["title", "content", "tags"] },
  knowledge: { entity: "Knowledge", sort: "-updated_date", fields: ["title", "content", "category", "tags"] },
  project: { entity: "Project", sort: "-updated_date", fields: ["title", "description", "next_action", "blockers"] },
  task: { entity: "Task", sort: "-updated_date", fields: ["title", "description"] },
  learning: { entity: "LearningItem", sort: "-updated_date", fields: ["title", "content"] },
  decision: { entity: "Decision", sort: "-updated_date", fields: ["title", "decision", "context", "reasoning"] },
  lesson: { entity: "Lesson", sort: "-created_date", fields: ["title", "what_happened", "learned"] },
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function dateCutoff(dateFilter) {
  const now = new Date();
  if (dateFilter === "today") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (dateFilter === "week") return new Date(now - 7 * 86400000);
  if (dateFilter === "month") return new Date(now - 30 * 86400000);
  return null;
}

// Returns null when a filter rules the type out entirely (e.g. tag filter on tasks).
export function buildQuery(type, { workspace, q, projectFilter, tagFilter, statusFilter, dateFilter }) {
  const cfg = SEARCH_ENTITIES[type];
  const query = { workspace };
  if (tagFilter !== "all") {
    if (!cfg.fields.includes("tags")) return null;
    query.tags = tagFilter;
  }
  if (projectFilter !== "all") {
    if (type === "project") query.id = projectFilter;
    else query.project_id = projectFilter;
  }
  if (statusFilter !== "all") query.status = statusFilter;
  const cutoff = dateCutoff(dateFilter);
  if (cutoff) query.created_date = { $gte: cutoff.toISOString() };
  if (q) {
    const pattern = escapeRegex(q);
    query.$or = cfg.fields.map((f) => ({ [f]: { $regex: pattern, $options: "i" } }));
  }
  return query;
}

// Fetches one page for a type; retries once on rate limit.
export async function fetchPage(type, query, cursor) {
  const cfg = SEARCH_ENTITIES[type];
  const run = () => base44.entities[cfg.entity].filter(query, { sort: cfg.sort, limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) });
  try { return await run(); }
  catch (e) {
    if (!/rate limit/i.test(e?.message || "")) throw e;
    await new Promise((r) => setTimeout(r, 2500));
    return run();
  }
}