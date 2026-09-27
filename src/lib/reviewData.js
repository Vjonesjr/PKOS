import { base44 } from "@/api/base44Client";

const DAY_MS = 24 * 60 * 60 * 1000;

function isToday(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr).toDateString() === new Date().toDateString();
}

function withinDays(dateStr, days) {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() >= Date.now() - days * DAY_MS;
}

function projectLink(id) {
  return id ? `/project-detail?id=${id}` : "/projects";
}

async function loadAll(workspace) {
  const [tasks, captures, projects, decisions, lessons, knowledge, learningItems] = await Promise.all([
    base44.entities.Task.filter({ workspace }, "-updated_date", 300),
    base44.entities.Capture.filter({ workspace }, "-created_date", 200),
    base44.entities.Project.filter({ workspace }, "-updated_date", 200),
    base44.entities.Decision.filter({ workspace }, "-date", 100),
    base44.entities.Lesson.filter({ workspace }, "-created_date", 100),
    base44.entities.Knowledge.filter({ workspace }, "-updated_date", 200),
    base44.entities.LearningItem.filter({ workspace }, "-updated_date", 100),
  ]);
  return { tasks, captures, projects, decisions, lessons, knowledge, learningItems };
}

export async function buildTimeline(workspace) {
  const { tasks, captures, projects, decisions, lessons, knowledge, learningItems } = await loadAll(workspace);

  const items = [
    ...captures.map((c) => ({
      id: `capture-${c.id}`,
      type: "Capture",
      date: c.created_date,
      label: c.title || (c.content ? c.content.slice(0, 60) : "New capture"),
      link: "/capture",
    })),
    ...tasks
      .filter((t) => t.status === "done")
      .map((t) => ({
        id: `task-${t.id}`,
        type: "Task",
        date: t.updated_date,
        label: `Completed task: ${t.title}`,
        link: projectLink(t.project_id),
      })),
    ...projects.map((p) => ({
      id: `project-${p.id}`,
      type: "Project",
      date: p.updated_date,
      label: `Project updated: ${p.title} (${p.status})`,
      link: projectLink(p.id),
    })),
    ...decisions.map((d) => ({
      id: `decision-${d.id}`,
      type: "Decision",
      date: d.date || d.updated_date,
      label: `Decision: ${d.title || d.decision}`,
      link: `/decision-detail?id=${d.id}`,
    })),
    ...lessons.map((l) => ({
      id: `lesson-${l.id}`,
      type: "Lesson",
      date: l.created_date,
      label: `Lesson: ${l.title || l.learned}`,
      link: `/lesson-detail?id=${l.id}`,
    })),
    ...learningItems.map((li) => ({
      id: `learning-${li.id}`,
      type: "Learning",
      date: li.updated_date,
      label: li.status === "completed" ? `Completed learning: ${li.title}` : `Learning updated: ${li.title}`,
      link: "/learning",
    })),
    ...knowledge.map((k) => ({
      id: `knowledge-${k.id}`,
      type: "Knowledge",
      date: k.updated_date,
      label: `Knowledge edited: ${k.title}`,
      link: `/knowledge-detail?id=${k.id}`,
    })),
  ].filter((e) => e.date);

  return items.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export async function buildDailyReview(workspace) {
  const { tasks, captures, projects } = await loadAll(workspace);

  const completedToday = tasks
    .filter((t) => t.status === "done" && isToday(t.updated_date))
    .map((t) => ({ id: t.id, label: t.title, link: projectLink(t.project_id) }));

  const unfinished = tasks
    .filter((t) => t.status !== "done")
    .sort((a, b) => (a.priority === "high" ? -1 : b.priority === "high" ? 1 : 0))
    .slice(0, 10)
    .map((t) => ({ id: t.id, label: t.title, link: projectLink(t.project_id) }));

  const newCaptures = captures
    .filter((c) => isToday(c.created_date))
    .map((c) => ({ id: c.id, label: c.title || (c.content ? c.content.slice(0, 60) : "New capture"), link: "/capture" }));

  const activeProjects = projects.filter((p) => p.status === "Active");

  const priorities = activeProjects
    .filter((p) => p.priority === "high")
    .map((p) => ({ id: p.id, label: p.title, link: projectLink(p.id) }));

  const nextActions = activeProjects
    .filter((p) => p.next_action)
    .slice(0, 6)
    .map((p) => ({ id: p.id, label: `${p.title}: ${p.next_action}`, link: projectLink(p.id) }));

  return { completedToday, unfinished, newCaptures, priorities, nextActions };
}

export async function buildWeeklyReview(workspace) {
  const { tasks, projects, decisions, lessons, knowledge } = await loadAll(workspace);

  const completedWork = tasks
    .filter((t) => t.status === "done" && withinDays(t.updated_date, 7))
    .map((t) => ({ id: t.id, label: t.title, link: projectLink(t.project_id) }));

  const unfinished = tasks
    .filter((t) => t.status !== "done" && t.priority === "high")
    .slice(0, 10)
    .map((t) => ({ id: t.id, label: t.title, link: projectLink(t.project_id) }));

  const activeProjects = projects.filter((p) => p.status === "Active");

  const stalledProjects = activeProjects
    .filter((p) => !withinDays(p.updated_date, 14) || !p.next_action)
    .map((p) => ({ id: p.id, label: p.title, link: projectLink(p.id) }));

  const majorDecisions = decisions
    .filter((d) => withinDays(d.date || d.updated_date, 7))
    .map((d) => ({ id: d.id, label: d.title || d.decision, link: `/decision-detail?id=${d.id}` }));

  const weekLessons = lessons
    .filter((l) => withinDays(l.created_date, 7))
    .map((l) => ({ id: l.id, label: l.title || l.learned, link: `/lesson-detail?id=${l.id}` }));

  const importantKnowledge = knowledge
    .filter((k) => withinDays(k.updated_date, 7))
    .sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0))
    .slice(0, 10)
    .map((k) => ({ id: k.id, label: k.title, link: `/knowledge-detail?id=${k.id}` }));

  const progress = {
    completedCount: completedWork.length,
    activeProjectCount: activeProjects.length,
    stalledCount: stalledProjects.length,
  };

  return { progress, completedWork, unfinished, stalledProjects, majorDecisions, lessons: weekLessons, importantKnowledge };
}