export const GOAL_AREAS = ["Career", "Health", "Learning", "Finance", "Relationships", "Personal", "Other"];
export const GOAL_STATUSES = ["Draft", "Active", "Paused", "Achieved", "Dropped"];
export const PROGRESS_MODES = [
  ["rollup", "From linked projects"],
  ["key_results", "Key results"],
  ["manual", "Manual"],
];

const avg = (xs) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);

/** Goal progress 0-100. `projects` are the projects linked to this goal. */
export function goalProgress(goal, projects = []) {
  if (goal.status === "Achieved") return 100;
  if (goal.progress_mode === "manual") return Math.min(100, goal.manual_progress || 0);
  if (goal.progress_mode === "key_results")
    return avg((goal.key_results || []).filter((k) => k.target > 0).map((k) => Math.min(100, ((k.current || 0) / k.target) * 100)));
  return avg(projects.map((p) => (p.status === "Completed" ? 100 : p.progress || 0)));
}