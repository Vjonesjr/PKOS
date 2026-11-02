// Builds server-side search queries so filtering happens in the database, with a safe client fallback.
import { base44 } from "@/api/base44Client";

export const PAGE_SIZE = 20;

export const SEARCH_ENTITIES = {
  capture: { entity: "Capture", sort: "-created_date", fields: ["title", "content", "tags"] },
  chat_link: { entity: "ChatLink", sort: "-updated_date", fields: ["title", "provider", "url", "original_text", "notes", "tags"] },
  knowledge: { entity: "Knowledge", sort: "-updated_date", fields: ["title", "content", "category", "tags"] },
  project: { entity: "Project", sort: "-updated_date", fields: ["title", "description", "next_action", "blockers"] },
  task: { entity: "Task", sort: "-updated_date", fields: ["title", "description"] },
  learning: { entity: "LearningItem", sort: "-updated_date", fields: ["title", "content"] },
  decision: { entity: "Decision", sort: "-updated_date", fields: ["title", "decision", "context", "reasoning"] },
  lesson: { entity: "Lesson", sort: "-created_date", fields: ["title", "what_happened", "learned"] },
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const asPage = (value) => Array.isArray(value)
  ? { items: value, next_cursor: null, has_more: false }
  : { items: value?.items || [], next_cursor: value?.next_cursor || null, has_more: Boolean(value?.has_more) };

function dateCutoff(dateFilter) {
  const now = new Date();
  if (dateFilter === "today") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (dateFilter === "week") return new Date(now - 7 * 86400000);
  if (dateFilter === "month") return new Date(now - 30 * 86400000);
  return null;
}

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
    query.$or = cfg.fields.map((field) => ({ [field]: { $regex: pattern, $options: "i" } }));
  }
  return query;
}

function textFor(record, fields) {
  return fields.flatMap((field) => {
    const value = record?.[field];
    return Array.isArray(value) ? value : [value];
  }).filter(Boolean).join(" ").toLowerCase();
}

// Fetches one page. If regex search is unsupported/unstable, fall back to filtering recent records locally.
export async function fetchPage(type, query, cursor) {
  const cfg = SEARCH_ENTITIES[type];
  const run = (q = query, options = {}) => base44.entities[cfg.entity].filter(q, {
    sort: cfg.sort,
    limit: PAGE_SIZE,
    ...(cursor ? { cursor } : {}),
    ...options,
  });

  try {
    return asPage(await run());
  } catch (error) {
    if (/rate limit/i.test(error?.message || "")) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      try { return asPage(await run()); } catch { /* use fallback below */ }
    }

    if (query.$or && !cursor) {
      const fallbackQuery = { ...query };
      const clauses = fallbackQuery.$or;
      delete fallbackQuery.$or;
      const pattern = clauses?.[0] ? Object.values(clauses[0])[0]?.$regex || "" : "";
      const needle = pattern.replace(/\\([.*+?^${}()|[\]\\])/g, "$1").toLowerCase();
      const page = asPage(await base44.entities[cfg.entity].filter(fallbackQuery, { sort: cfg.sort, limit: 200 }));
      return {
        items: needle ? page.items.filter((record) => textFor(record, cfg.fields).includes(needle)).slice(0, PAGE_SIZE) : page.items.slice(0, PAGE_SIZE),
        next_cursor: null,
        has_more: false,
      };
    }
    throw error;
  }
}
