// Starter templates. Project/target params are chosen by the user in the builder.
export const TEMPLATES = [
  { name: "Process interview captures", description: "Captures tagged Interview get connected to your interview prep project.", trigger: "capture_created", conditions: [{ field: "tag", value: "Interview" }], action: "connect_project", action_params: {}, hint: "BI Interview Prep" },
  { name: "Stalled project watch", description: "Projects without a next action show up in Review.", trigger: "project_updated", conditions: [{ field: "no_next_action", value: "" }], action: "add_review", action_params: {} },
  { name: "Learning organizer", description: "Python knowledge gets a suggested link to your Python learning item.", trigger: "knowledge_created", conditions: [{ field: "tag", value: "Python" }], action: "suggest_link", action_params: {}, hint: "Python" },
  { name: "Project completion review", description: "When a project is completed, you get a reflection prompt.", trigger: "project_status_changed", conditions: [{ field: "status", value: "Completed" }], action: "review_prompt", action_params: { text: "What did you learn from {title}?" } },
  { name: "High priority task watch", description: "Overdue high-priority tasks are surfaced in Today.", trigger: "task_overdue", conditions: [{ field: "priority", value: "high" }], action: "surface_today", action_params: {} },
];