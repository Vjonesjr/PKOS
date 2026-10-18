// Persists a reviewed plan. Skips titles that already exist (or repeat in the file) to avoid duplicates.
import { base44 } from "@/api/base44Client";

const norm = (t) => t.trim().toLowerCase();
const cleanMilestones = (ms) => ms.filter((m) => m.title.trim()).map((m) => ({ title: m.title.trim(), done: !!m.done, ...(m.due_date ? { due_date: m.due_date } : {}) }));

/** Existing goals/projects with matching titles in this workspace: { goals: Map(title→id), projects: Set(title) }. */
export async function findExisting(workspace, plan) {
  const gTitles = plan.goals.map((g) => g.title.trim()).filter(Boolean);
  const pTitles = plan.projects.map((p) => p.title.trim()).filter(Boolean);
  const [goals, projects] = await Promise.all([
    gTitles.length ? base44.entities.Goal.filter({ workspace, title: { $in: gTitles } }, { limit: 200, fields: ["title"] }) : { items: [] },
    pTitles.length ? base44.entities.Project.filter({ workspace, title: { $in: pTitles } }, { limit: 200, fields: ["title"] }) : { items: [] },
  ]);
  return { goals: new Map(goals.items.map((g) => [norm(g.title), g.id])), projects: new Set(projects.items.map((p) => norm(p.title))) };
}

export async function applyPlan(workspace, plan) {
  const existing = await findExisting(workspace, plan);
  const skipped = [], failed = [];
  const goalIds = {}; // "new:<key>" → saved or existing goal id
  const seenGoals = new Set();
  const newGoals = [];
  plan.goals.filter((g) => g.include && g.title.trim()).forEach((g) => {
    const t = norm(g.title);
    if (existing.goals.has(t)) { goalIds[`new:${g.key}`] = existing.goals.get(t); skipped.push({ title: g.title, reason: "Goal already exists; linked instead" }); }
    else if (seenGoals.has(t)) skipped.push({ title: g.title, reason: "Repeated in file" });
    else { seenGoals.add(t); newGoals.push(g); }
  });

  let milestones = 0;
  if (newGoals.length) {
    try {
      const saved = await base44.entities.Goal.bulkCreate(newGoals.map((g) => ({
        title: g.title.trim(), area: g.area, priority: g.priority, why: g.why, status: "Active", workspace,
        ...(g.target_date ? { target_date: g.target_date } : {}), milestones: cleanMilestones(g.milestones),
      })));
      saved.forEach((s, i) => { goalIds[`new:${newGoals[i].key}`] = s.id; milestones += cleanMilestones(newGoals[i].milestones).length; });
    } catch (e) { newGoals.forEach((g) => failed.push({ title: g.title, reason: e.message })); newGoals.length = 0; }
  }

  const seenProjects = new Set();
  const newProjects = plan.projects.filter((p) => {
    if (!p.include || !p.title.trim()) return false;
    const t = norm(p.title);
    if (existing.projects.has(t)) { skipped.push({ title: p.title, reason: "Project already exists" }); return false; }
    if (seenProjects.has(t)) { skipped.push({ title: p.title, reason: "Repeated in file" }); return false; }
    seenProjects.add(t); return true;
  });
  let projectCount = 0;
  if (newProjects.length) {
    try {
      await base44.entities.Project.bulkCreate(newProjects.map((p) => {
        const goal_id = p.goal_key.startsWith("id:") ? p.goal_key.slice(3) : goalIds[p.goal_key];
        return { title: p.title.trim(), status: p.status, priority: p.priority, description: p.description, workspace, milestones: cleanMilestones(p.milestones), ...(goal_id ? { goal_id } : {}) };
      }));
      projectCount = newProjects.length;
      newProjects.forEach((p) => (milestones += cleanMilestones(p.milestones).length));
    } catch (e) { newProjects.forEach((p) => failed.push({ title: p.title, reason: e.message })); }
  }
  return { goals: newGoals.length, projects: projectCount, milestones, skipped, failed };
}