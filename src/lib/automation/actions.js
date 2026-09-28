import { base44 } from "@/api/base44Client";
import { TYPES, today, recordTitle } from "@/lib/automation/catalog";

const TAGGABLE = ["capture", "knowledge"];
const fill = (text, type, r) => (text || "").replace(/\{title\}/g, recordTitle(type, r));
const inDays = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

// level: "safe" runs automatically; "review" waits in Approvals until you approve it.
// Automations never delete, merge, overwrite long text, or remove links.
export const ACTIONS = {
  add_tag: {
    label: "Add a tag", level: "safe", params: ["tag"], types: TAGGABLE,
    describe: (p) => `Add tag “${p.tag}”`,
    run: async (type, r, p) => {
      if ((r.tags || []).includes(p.tag)) return { message: "Tag already present" };
      await TYPES[type].entity.update(r.id, { tags: [...(r.tags || []), p.tag] });
      return { message: `Added tag “${p.tag}”` };
    },
  },
  mark_important: {
    label: "Mark as important", level: "safe", types: TAGGABLE,
    describe: () => "Mark as important",
    run: async (type, r) => {
      await TYPES[type].entity.update(r.id, type === "capture" ? { important: true } : { favorite: true });
      return { message: "Marked important" };
    },
  },
  process_capture: {
    label: "Move capture to Processed", level: "safe", types: ["capture"],
    describe: () => "Move capture to Processed",
    run: async (type, r) => { await base44.entities.Capture.update(r.id, { status: "processed" }); return { message: "Moved to Processed" }; },
  },
  surface_today: {
    label: "Surface in Today", level: "safe",
    describe: () => "Show it in Today",
    run: async (type, r) => {
      if (type === "task") await base44.entities.Task.update(r.id, { today_date: today() });
      return { message: "Surfaced in Today", flag: "today" };
    },
  },
  add_review: { label: "Add to Review", level: "safe", describe: () => "Add to Review", run: async () => ({ message: "Added to Review", flag: "review" }) },
  flag_attention: { label: "Flag as needing attention", level: "safe", describe: () => "Flag as needing attention", run: async () => ({ message: "Flagged for attention", flag: "attention" }) },
  review_prompt: {
    label: "Create a Review prompt", level: "safe", params: ["text"],
    describe: (p, type, r) => `Review prompt: “${fill(p.text, type, r)}”`,
    run: async (type, r, p) => ({ message: fill(p.text, type, r), flag: "prompt" }),
  },
  connect_project: {
    label: "Connect to a project", level: "review", params: ["project"], types: ["capture", "knowledge", "task", "decision", "lesson", "learning"],
    describe: (p) => `Connect to project “${p.target_label || "?"}”`,
    run: async (type, r, p, ws) => {
      const project = p.project_id ? await base44.entities.Project.get(p.project_id).catch(() => null) : null;
      if (!project || project.workspace !== ws) throw new Error("The selected project is not available in this workspace");
      if (r.project_id && r.project_id !== p.project_id) throw new Error("Already belongs to another project — left unchanged");
      await TYPES[type].entity.update(r.id, { project_id: p.project_id });
      return { message: `Connected to ${project.title}` };
    },
  },
  create_task: {
    label: "Create a task", level: "review", params: ["text"],
    describe: (p, type, r) => `Create task “${fill(p.text || "Follow up on {title}", type, r)}”`,
    run: async (type, r, p, ws) => {
      const t = await base44.entities.Task.create({ title: fill(p.text || "Follow up on {title}", type, r), project_id: type === "project" ? r.id : r.project_id, workspace: ws });
      return { message: `Created task “${t.title}”`, createdId: t.id };
    },
  },
  create_followup: {
    label: "Create a follow-up reminder (3 days)", level: "review",
    describe: (p, type, r) => `Create follow-up “Follow up: ${recordTitle(type, r)}” due in 3 days`,
    run: async (type, r, p, ws) => {
      const t = await base44.entities.Task.create({ title: `Follow up: ${recordTitle(type, r)}`, due_date: inDays(3), project_id: type === "project" ? r.id : r.project_id, workspace: ws });
      return { message: "Follow-up created", createdId: t.id };
    },
  },
  suggest_link: {
    label: "Link to a learning or knowledge item", level: "review", params: ["target"],
    describe: (p) => `Link to “${p.target_label || "?"}”`,
    run: async (type, r, p, ws) => {
      if (!["learning", "knowledge"].includes(p.target_type) || !p.target_id) throw new Error("Choose a valid learning or knowledge target");
      const target = await TYPES[p.target_type].entity.get(p.target_id).catch(() => null);
      if (!target || target.workspace !== ws) throw new Error("The selected target is not available in this workspace");
      const existing = await base44.entities.Link.filter({ source_type: type, source_id: r.id, target_type: p.target_type, target_id: p.target_id, workspace: ws });
      if (existing.length) return { message: "Already linked" };
      await base44.entities.Link.create({ source_type: type, source_id: r.id, target_type: p.target_type, target_id: p.target_id, workspace: ws });
      return { message: `Linked to ${target.title || p.target_label}` };
    },
  },
};

export const actionApplies = (action, type) => !!action && (!action.types || action.types.includes(type));