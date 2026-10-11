import { base44 } from "@/api/base44Client";
import { TRIGGERS, TYPES, matchesTrigger, matchesConditions, recordTitle } from "@/lib/automation/catalog";
import { ACTIONS, actionApplies } from "@/lib/automation/actions";
import { claimEvent, releaseEvent } from "@/lib/automation/claim";

// Loop protection:
// 1) callers provide a stable key for scan events or an event-specific key for live changes,
// 2) records changed/created by an automation are ignored for a short window,
// so automations do not recursively trigger themselves while legitimate later user edits can still run.
export const touched = new Set();
const localDate = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
const touch = (id) => { if (!id) return; touched.add(id); setTimeout(() => touched.delete(id), 15000); };

const bumpRecipe = (recipe, result) =>
  base44.entities.AutomationRecipe.update(recipe.id, { last_run: new Date().toISOString(), last_result: result, run_count: (recipe.run_count || 0) + 1 });

export async function applyAction(recipe, type, record) {
  const action = ACTIONS[recipe.action];
  touch(record.id);
  const res = await action.run(type, record, recipe.action_params || {}, recipe.workspace);
  touch(res.createdId);
  return res;
}

export async function processRecord(recipe, type, record, runKeys, explicitKey) {
  const key = explicitKey || `${recipe.id}:${record.id}`;
  if (runKeys.has(key)) return;
  runKeys.add(key);
  // Cross-tab / cross-device guard: only the first claimant of this event key proceeds.
  if (!(await claimEvent(key, recipe.workspace))) return;
  const action = ACTIONS[recipe.action];
  const base = { recipe_id: recipe.id, recipe_name: recipe.name, trigger: recipe.trigger, action: recipe.action, record_type: type, record_id: record.id, record_title: recordTitle(type, record), workspace: recipe.workspace, run_key: key, source: "live", digest_date: localDate() };

  if (!actionApplies(action, type)) {
    await base44.entities.AutomationRun.create({ ...base, status: "skipped", message: `This action doesn't apply to ${TYPES[type].label.toLowerCase()} records` });
    return bumpRecipe(recipe, "skipped");
  }
  if (action.level === "review") {
    await base44.entities.AutomationRun.create({ ...base, status: "pending_review", message: action.describe(recipe.action_params || {}, type, record) });
    return bumpRecipe(recipe, "awaiting approval");
  }
  try {
    const res = await applyAction(recipe, type, record);
    await base44.entities.AutomationRun.create({ ...base, status: "success", message: res.message, flag: res.flag || "none", flag_open: !!res.flag });
    await bumpRecipe(recipe, "success");
  } catch (e) {
    // A transient failure should be eligible for retry instead of being suppressed for the rest of the session.
    runKeys.delete(key);
    await releaseEvent(key);
    await base44.entities.AutomationRun.create({ ...base, status: "failed", message: e.message || "Unknown error" });
    await bumpRecipe(recipe, "failed");
  }
}

// Approve (or retry) a run that needs the user's go-ahead. Source data is only touched by the single action.
export async function approveRun(run) {
  const [recipe] = await base44.entities.AutomationRecipe.filter({ id: run.recipe_id, workspace: run.workspace });
  if (!recipe) return base44.entities.AutomationRun.update(run.id, { status: "failed", message: "The recipe was deleted" });
  const record = await TYPES[run.record_type].entity.get(run.record_id).catch(() => null);
  if (!record || record.workspace !== run.workspace) return base44.entities.AutomationRun.update(run.id, { status: "failed", message: "The record no longer exists in this workspace" });
  try {
    const res = await applyAction(recipe, run.record_type, record);
    await base44.entities.AutomationRun.update(run.id, { status: "success", message: res.message, flag: res.flag || "none", flag_open: !!res.flag });
  } catch (e) {
    await base44.entities.AutomationRun.update(run.id, { status: "failed", message: e.message || "Unknown error" });
  }
}

// Dry run: shows what WOULD happen on recent records, changes nothing.
export async function testRecipe(recipe) {
  const trigger = TRIGGERS[recipe.trigger];
  const action = ACTIONS[recipe.action];
  if (trigger.event === "nightly") {
    // Nightly rules are evaluated by the server; it previews last night's check for this recipe only.
    const { data } = await base44.functions.invoke("markMissedHabits", { dry_run: true, recipe_id: recipe.id });
    return (data.results || []).map((x) => ({
      type: x.record_type, record: { id: x.record_id }, title: x.record_title, outcome: x.message,
      level: x.status === "pending_review" ? "review" : x.status === "skipped" ? "skip" : "safe",
    }));
  }
  const lists = await Promise.all(trigger.types.map((t) => TYPES[t].entity.filter({ workspace: recipe.workspace }, "-updated_date", 30).then((rs) => rs.map((r) => ({ type: t, r })))));
  return lists.flat()
    .filter(({ type, r }) => matchesTrigger(trigger, type, r) && matchesConditions(recipe, type, r))
    .slice(0, 15)
    .map(({ type, r }) => ({
      type, record: r, title: recordTitle(type, r),
      outcome: !actionApplies(action, type) ? "Would be skipped — action doesn't apply" : action.describe(recipe.action_params || {}, type, r),
      level: actionApplies(action, type) ? action.level : "skip",
    }));
}