// Parsing for plan imports (goals, projects, milestones). Pure functions, no persistence.
import { GOAL_AREAS } from "@/lib/goals";

export const PLAN_EXTS = ["csv", "json", "txt"];
export const PLAN_MAX_BYTES = 1024 * 1024; // 1 MB keeps parsing and AI calls bounded
export const MAX_RECORDS = 100;

const PRIORITIES = ["low", "medium", "high"];
const PROJECT_STATUSES = ["Idea", "Planned", "Active", "Waiting", "Completed", "Archived"];
const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v || "");
const pick = (v, list, fallback) => list.find((x) => x.toLowerCase() === String(v || "").trim().toLowerCase()) || fallback;
let seq = 0;
const key = () => `k${++seq}`;

export const CSV_TEMPLATE = `type,title,parent,area,status,priority,target_date,description
goal,Run a half marathon,,Health,,high,2027-04-01,Finish under 2 hours
milestone,Run 10k without stopping,Run a half marathon,,,,2026-12-01,
project,Training plan,Run a half marathon,,Active,medium,,12-week schedule
milestone,Buy running shoes,Training plan,,,,2026-11-01,
`;

export const JSON_TEMPLATE = JSON.stringify({
  goals: [{
    title: "Run a half marathon", area: "Health", priority: "high", target_date: "2027-04-01", why: "Finish under 2 hours",
    milestones: [{ title: "Run 10k without stopping", due_date: "2026-12-01" }],
    projects: [{ title: "Training plan", status: "Active", description: "12-week schedule", milestones: [{ title: "Buy running shoes", due_date: "2026-11-01" }] }],
  }],
  projects: [{ title: "Standalone project", status: "Idea" }],
}, null, 2);

const milestone = (m) => ({ title: String(m?.title || m || "").trim().slice(0, 200), due_date: isDate(m?.due_date) ? m.due_date : "", done: !!m?.done });

export const normGoal = (g) => ({
  key: key(), title: String(g.title || "").trim().slice(0, 200), area: pick(g.area, GOAL_AREAS, "Personal"),
  priority: pick(g.priority, PRIORITIES, "medium"), target_date: isDate(g.target_date) ? g.target_date : "",
  why: String(g.why || g.description || "").slice(0, 1000), milestones: (g.milestones || []).map(milestone).filter((m) => m.title), include: true,
});

export const normProject = (p, goalKey = "") => ({
  key: key(), title: String(p.title || "").trim().slice(0, 200), status: pick(p.status, PROJECT_STATUSES, "Idea"),
  priority: pick(p.priority, PRIORITIES, "medium"), description: String(p.description || "").slice(0, 2000),
  goal_key: goalKey ? `new:${goalKey}` : "", milestones: (p.milestones || []).map(milestone).filter((m) => m.title), include: true,
});

/** Minimal RFC-4180 CSV parser (quoted fields, escaped quotes, newlines in quotes). */
export function parseCsv(text) {
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}

/** Builds a plan from template-shaped data. Returns null when the shape isn't recognized. */
function fromCsv(text) {
  const [head, ...rows] = parseCsv(text);
  const cols = (head || []).map((h) => h.trim().toLowerCase());
  if (!cols.includes("type") || !cols.includes("title")) return null;
  const recs = rows.map((r) => Object.fromEntries(cols.map((c, i) => [c, (r[i] || "").trim()])));
  const goals = [], projects = [], warnings = [];
  const byTitle = (list, t) => list.find((x) => x.title.toLowerCase() === t.toLowerCase());
  recs.filter((r) => r.type.toLowerCase() === "goal").forEach((r) => goals.push(normGoal(r)));
  recs.filter((r) => r.type.toLowerCase() === "project").forEach((r) => {
    const g = r.parent && byTitle(goals, r.parent);
    if (r.parent && !g) warnings.push(`Project "${r.title}": goal "${r.parent}" not found in file; you can link it below.`);
    projects.push(normProject(r, g?.key || ""));
  });
  recs.forEach((r, i) => {
    const t = r.type.toLowerCase();
    if (t === "milestone") {
      const parent = r.parent && (byTitle(projects, r.parent) || byTitle(goals, r.parent));
      if (!parent) warnings.push(`Row ${i + 2}: milestone "${r.title}" has no matching parent "${r.parent}"; skipped.`);
      else parent.milestones.push(milestone({ title: r.title, due_date: r.due_date || r.target_date }));
    } else if (!["goal", "project"].includes(t)) warnings.push(`Row ${i + 2}: unknown type "${r.type}"; skipped.`);
  });
  return { goals, projects, warnings };
}

function fromJson(text) {
  const data = JSON.parse(text);
  if (!data || typeof data !== "object" || (!Array.isArray(data.goals) && !Array.isArray(data.projects))) return null;
  const goals = [], projects = [];
  (data.goals || []).forEach((g) => {
    const goal = normGoal(g); goals.push(goal);
    (g.projects || []).forEach((p) => projects.push(normProject(p, goal.key)));
  });
  (data.projects || []).forEach((p) => projects.push(normProject(p)));
  return { goals, projects, warnings: [] };
}

/** Template parsing. Returns {plan} or {raw} when the file needs smart detection. */
export function parseTemplate(ext, text) {
  if (ext === "csv") { const plan = fromCsv(text); return plan ? { plan } : { raw: text }; }
  if (ext === "json") {
    try { const plan = fromJson(text); return plan ? { plan } : { raw: text }; }
    catch { throw new Error("This JSON file is malformed. Fix it or use the JSON template."); }
  }
  return { raw: text };
}

/** Shared checks; drops empty titles and caps size so nothing oversized is saved. */
export function finalizePlan(plan) {
  const warnings = [...(plan.warnings || [])];
  const goals = plan.goals.filter((g) => g.title);
  const projects = plan.projects.filter((p) => p.title);
  const dropped = plan.goals.length + plan.projects.length - goals.length - projects.length;
  if (dropped) warnings.push(`${dropped} record(s) without a title were skipped.`);
  if (goals.length + projects.length > MAX_RECORDS) warnings.push(`Only the first ${MAX_RECORDS} records are shown.`);
  return { goals: goals.slice(0, MAX_RECORDS), projects: projects.slice(0, Math.max(0, MAX_RECORDS - goals.length)), warnings };
}

/** Converts the AI detection response into the same plan shape templates produce. */
export function fromDetected(r) {
  const goals = (r.goals || []).map(normGoal);
  const byTitle = new Map(goals.map((g) => [g.title.toLowerCase(), g.key]));
  const projects = (r.projects || []).map((p) => normProject(p, byTitle.get(String(p.goal_title || "").toLowerCase()) || ""));
  return { goals, projects, warnings: ["Structure was detected by AI. Check titles, dates and links carefully."] };
}

export function downloadTemplate(kind) {
  const [body, type] = kind === "csv" ? [CSV_TEMPLATE, "text/csv"] : [JSON_TEMPLATE, "application/json"];
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([body], { type }));
  a.download = `plan-import-template.${kind}`;
  a.click();
  URL.revokeObjectURL(a.href);
}