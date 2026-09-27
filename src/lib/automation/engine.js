import { base44 } from "@/api/base44Client";
import { TRIGGERS, TYPES, matchesTrigger, matchesConditions, recordTitle } from "@/lib/automation/catalog";
import { ACTIONS, actionApplies } from "@/lib/automation/actions";

// Loop protection:
// 1) each recipe runs at most once per record (keyed recipe:record),
// 2) records changed/created by an automation are ignored for a short window,
// so an automation can never keep re-triggering itself or another automation.
export const touched = new Set();
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

export async function processRecord(recipe, type, record, runKeys) {
  const key = `${recipe.id}:${record.id}`;
  if (runKeys.has(key)) return;
  runKeys.add(key);
  const action = ACTIONS[recipe.action];
  const base = { recipe_id: recipe.id, recipe_name: recipe.name, trigger: recipe.trigger, action: recipe.action, record_type: type, record_id: record.id, record_title: recordTitle(type, record), workspace: recipe.workspace };

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
    await base44.entities.AutomationRun.create({ ...base, status: "failed", message: e.message || "Unknown error" });
    await bumpRecipe(recipe, "failed");
  }
}

// Approve (or retry) a run that needs the user's go-ahead. Source data is only touched by the single action.
export async function approveRun(run) {
  const [recipe] = await base44.entities.AutomationRecipe.filter({ id: run.recipe_id });
  if (!recipe) return base44.entities.AutomationRun.update(run.id, { status: "failed", message: "The recipe was deleted" });
  const record = await TYPES[run.record_type].entity.get(run.record_id).catch(() => null);
  if (!record) return base44.entities.AutomationRun.update(run.id, { status: "failed", message: "The record no longer exists" });
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