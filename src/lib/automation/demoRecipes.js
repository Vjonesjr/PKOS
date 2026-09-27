import { base44 } from "@/api/base44Client";

// Example recipes for the Demo workspace only (never Personal).
export async function seedDemoRecipes(projects, targets) {
  const project = projects[0];
  const target = targets.find((t) => t.type === "learning") || targets[0];
  const base = { workspace: "demo", run_count: 0 };
  await base44.entities.AutomationRecipe.bulkCreate([
    { ...base, name: "High priority task watch", description: "Overdue high-priority tasks show up in Today.", enabled: true, trigger: "task_overdue", conditions: [{ field: "priority", value: "high" }], action: "surface_today", action_params: {} },
    { ...base, name: "Project completion review", description: "Reflect when a project is completed.", enabled: true, trigger: "project_status_changed", conditions: [{ field: "status", value: "Completed" }], action: "review_prompt", action_params: { text: "What did you learn from {title}?" } },
    { ...base, name: "Stalled project watch", description: "Projects without a next action go to Review.", enabled: true, trigger: "project_updated", conditions: [{ field: "no_next_action", value: "" }], action: "add_review", action_params: {} },
    ...(project ? [{ ...base, name: "Process interview captures", description: "Connect Interview captures to a project.", enabled: false, trigger: "capture_created", conditions: [{ field: "tag", value: "Interview" }], action: "connect_project", action_params: { project_id: project.id, target_label: project.title } }] : []),
    ...(target ? [{ ...base, name: "Learning organizer", description: "Suggest links for Python knowledge.", enabled: false, trigger: "knowledge_created", conditions: [{ field: "tag", value: "Python" }], action: "suggest_link", action_params: { target_id: target.id, target_type: target.type, target_label: target.title } }] : []),
  ]);
}