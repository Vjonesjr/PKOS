// Persists a reviewed plan. Skips titles that already exist (or repeat in the file) to avoid duplicates.
import { base44 } from "@/api/base44Client";

const norm = (t) => t.trim().toLowerCase();
const cleanMilestones = (ms) => ms.filter((m) => m.title.trim()).map((m) => ({ title: m.title.trim(), done: !!m.done, ...(m.due_date ? { due_date: m.due_date } : {}) }));

/** Existing goals/projects with matching titles in this workspace: { goals: Map(title→id), projects: Set(title) }. */
export async function findExisting(workspace, plan) {
  const gTitles = plan.goals.map((g) => g.title.trim()).filter(Boolean);
  const pTitles = plan.projects.map((p) => p.title.trim()).filter(Boolean);
  const [goals, projects, tasks] = await Promise.all([
    gTitles.length ? base44.entities.Goal.filter({ workspace, title: { $in: gTitles } }, { limit: 200, fields: ["title"] }) : { items: [] },
    pTitles.length ? base44.entities.Project.filter({ workspace, title: { $in: pTitles } }, { limit: 200, fields: ["title"] }) : { items: [] },
    base44.entities.Task.filter({ workspace, archived: { $ne: true } }, { limit: 5000, fields: ["title", "goal_id", "project_id"] }),
  ]);
  return { goals: new Map(goals.items.map((g) => [norm(g.title), g.id])), projects: new Set(projects.items.map((p) => norm(p.title))), tasks: new Set(tasks.items.map((t) => norm(t.title))) };
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

  let milestones = 0, projectCount = 0, taskCount = 0;
  if (newGoals.length) {
    try {
      const saved = await base44.entities.Goal.bulkCreate(newGoals.map((g) => ({
        title: g.title.trim(), area: g.area, priority: g.priority, why: g.why, status: "Active", workspace,
        ...(g.target_date ? { target_date: g.target_date } : {}), milestones: cleanMilestones(g.milestones),
      })));
      saved.forEach((s, i) => { goalIds[`new:${newGoals[i].key}`] = s.id; milestones += cleanMilestones(newGoals[i].milestones).length; });
    } catch (e) { newGoals.forEach((g) => failed.push({ title: g.title, reason: e.message })); newGoals.length = 0; }
  }

  const suggested = plan.goals.filter((g) => g.include && g.title.trim()).flatMap((g) => (g.suggested_tasks || []).map((title) => ({ title, goal_id: goalIds[`new:${g.key}`] })));
  const newGoalTasks = suggested.filter((t, i) => {
    const title = norm(t.title);
    if (!t.goal_id || !title) return false;
    if (existing.tasks.has(title)) { skipped.push({ title: t.title, reason: "Task already exists" }); return false; }
    if (suggested.findIndex((x) => norm(x.title) === title) !== i) { skipped.push({ title: t.title, reason: "Repeated in file" }); return false; }
    existing.tasks.add(title); return true;
  });
  if (newGoalTasks.length) {
    try {
      const saved = await base44.entities.Task.bulkCreate(newGoalTasks.map((t) => ({ title: t.title.trim(), status: "todo", goal_id: t.goal_id, workspace })));
      taskCount += saved.length;
    } catch (e) { newGoalTasks.forEach((t) => failed.push({ title: t.title, reason: `Goal task: ${e.message}` })); }
  }

  const seenProjects = new Set();
  const newProjects = plan.projects.filter((p) => {
    if (!p.include || !p.title.trim()) return false;
    const t = norm(p.title);
    if (existing.projects.has(t)) { skipped.push({ title: p.title, reason: "Project already exists" }); return false; }
    if (seenProjects.has(t)) { skipped.push({ title: p.title, reason: "Repeated in file" }); return false; }
    seenProjects.add(t); return true;
  });
  if (newProjects.length) {
    try {
      const savedProjects = await base44.entities.Project.bulkCreate(newProjects.map((p) => {
        const goal_id = p.goal_key.startsWith("id:") ? p.goal_key.slice(3) : goalIds[p.goal_key];
        return { title: p.title.trim(), status: p.status, priority: p.priority, description: p.description, workspace, milestones: cleanMilestones(p.milestones), ...(goal_id ? { goal_id } : {}) };
      }));
      projectCount = newProjects.length;
      newProjects.forEach((p) => (milestones += cleanMilestones(p.milestones).length));
      // Tasks are created one nesting level at a time so each subtask gets its saved parent's id.
      let level = newProjects.flatMap((p, i) => p.tasks.map((t) => ({ t, project_id: savedProjects[i].id, parent: null })));
      while (level.length) {
        level = level.filter((x) => x.t.title.trim());
        if (!level.length) break;
        try {
          const saved = await base44.entities.Task.bulkCreate(level.map(({ t, project_id, parent }) => ({
            title: t.title.trim(), priority: t.priority, status: "todo", project_id, workspace,
            ...(t.due_date ? { due_date: t.due_date } : {}), ...(parent ? { parent_task_id: parent } : {}),
          })));
          taskCount += saved.length;
          level = level.flatMap((x, i) => x.t.subtasks.map((s) => ({ t: s, project_id: x.project_id, parent: saved[i].id })));
        } catch (e) { level.forEach((x) => failed.push({ title: x.t.title, reason: `Task: ${e.message}` })); break; }
      }
    } catch (e) { newProjects.forEach((p) => failed.push({ title: p.title, reason: e.message })); }
  }
  return { goals: newGoals.length, projects: projectCount, tasks: taskCount, milestones, skipped, failed };
}