import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Nightly job (00:30 America/New_York) for day D = yesterday:
//  1. logs "missed" for due habits with no check-in (original behaviour),
//  2. evaluates enabled nightly goal/habit recipes, owner-scoped and deduplicated by run_key,
//  3. builds one DailyDigest per owner+workspace and emails it once (personal workspace only).
// Every step is retry-safe: missed logs check existing logs, runs check run_key, digests check digest_key + emailed.
// dry_run=true + recipe_id lets a signed-in user preview their own nightly recipe without writing anything.

const TZ = 'America/New_York';
const NIGHTLY = ['goal_due_soon', 'goal_checkin_missed', 'habit_streak_broken', 'habit_week_shortfall'];
const FLAGS = { surface_today: 'today', add_review: 'review', flag_attention: 'attention', review_prompt: 'prompt' };
const REVIEW = ['propose_status', 'create_task', 'create_followup'];
const DIGEST_STATUSES = ['success', 'pending_review', 'failed'];

const addDays = (d, n) => { const x = new Date(`${d}T12:00:00Z`); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const weekday = (d) => new Date(`${d}T12:00:00Z`).getUTCDay();
const mondayOf = (d) => addDays(d, -((weekday(d) + 6) % 7));

async function allPages(entity, query, opts = {}) {
  const out = [];
  let cursor;
  do {
    const page = await entity.filter(query, { limit: 500, ...opts, cursor });
    out.push(...page.items);
    cursor = page.has_more ? page.next_cursor : undefined;
  } while (cursor && out.length < 5000);
  return out;
}

async function markMissed(db, date) {
  const wd = weekday(date);
  const habits = await allPages(db.Habit, { active: true });
  const due = habits.filter((h) => h.schedule_type !== 'per_week' && (!h.start_date || h.start_date <= date) && (h.schedule_type !== 'weekdays' || (h.weekdays || []).includes(wd)));
  let marked = 0;
  for (let i = 0; i < due.length; i += 200) {
    const chunk = due.slice(i, i + 200);
    const logs = await allPages(db.HabitLog, { date, habit_id: { $in: chunk.map((h) => h.id) } }, { fields: ['habit_id'] });
    const logged = new Set(logs.map((l) => l.habit_id));
    const missing = chunk.filter((h) => !logged.has(h.id)).map((h) => ({ habit_id: h.id, date, status: 'missed', owner_id: h.created_by_id, workspace: h.workspace || 'personal' }));
    if (missing.length) await db.HabitLog.bulkCreate(missing);
    marked += missing.length;
  }
  return marked;
}

// Only conditions that make sense for goals/habits are evaluated on the server.
function matches(recipe, rec) {
  return (recipe.conditions || []).every((c) => {
    const v = String(c.value || '').toLowerCase();
    if (c.field === 'status') return String(rec.status ?? (rec.active === false ? 'Paused' : 'Active')).toLowerCase() === v;
    if (c.field === 'text') return String(rec.title || '').toLowerCase().includes(v);
    return false;
  });
}

// Returns [{ type, record, period, why }] for one recipe, scoped to the recipe owner + workspace.
async function candidates(db, recipe, D) {
  const T = addDays(D, 1);
  const scope = { created_by_id: recipe.created_by_id, workspace: recipe.workspace || 'personal' };
  const sunday = weekday(D) === 0;
  const ws = mondayOf(D);

  if (recipe.trigger === 'goal_due_soon') {
    const goals = await allPages(db.Goal, { ...scope, status: 'Active', target_date: { $gte: T, $lte: addDays(T, 7) } });
    return goals.map((g) => ({ type: 'goal', record: g, period: g.target_date, why: `Target date ${g.target_date} is within 7 days` }));
  }
  if (recipe.trigger === 'goal_checkin_missed') {
    if (!sunday) return [];
    const goals = (await allPages(db.Goal, { ...scope, status: 'Active' })).filter((g) => g.created_date.slice(0, 10) < ws);
    if (!goals.length) return [];
    const done = new Set((await allPages(db.GoalCheckin, { goal_id: { $in: goals.map((g) => g.id) }, week_start: ws }, { fields: ['goal_id'] })).map((c) => c.goal_id));
    return goals.filter((g) => !done.has(g.id)).map((g) => ({ type: 'goal', record: g, period: ws, why: `No check-in for the week of ${ws}` }));
  }
  const habits = (await allPages(db.Habit, { ...scope, active: true })).filter((h) =>
    recipe.trigger === 'habit_week_shortfall' ? h.schedule_type === 'per_week' : h.schedule_type !== 'per_week');
  if (!habits.length || (recipe.trigger === 'habit_week_shortfall' && !sunday)) return [];
  const logs = await allPages(db.HabitLog, { habit_id: { $in: habits.map((h) => h.id) }, date: { $gte: addDays(D, -14), $lte: D } });
  const byHabit = {};
  logs.forEach((l) => (byHabit[l.habit_id] ||= []).push(l));

  if (recipe.trigger === 'habit_streak_broken') {
    return habits.filter((h) => {
      const hl = (byHabit[h.id] || []).sort((a, b) => b.date.localeCompare(a.date));
      if (hl[0]?.date !== D || hl[0].status !== 'missed') return false;
      const prior = hl.slice(1).find((l) => l.status !== 'skipped');
      return prior?.status === 'done';
    }).map((h) => ({ type: 'habit', record: h, period: D, why: `Streak broken on ${D}` }));
  }
  if (recipe.trigger === 'habit_week_shortfall') {
    return habits.map((h) => ({ h, n: (byHabit[h.id] || []).filter((l) => l.status === 'done' && l.date >= ws).length }))
      .filter(({ h, n }) => n < (h.per_week_target || 3))
      .map(({ h, n }) => ({ type: 'habit', record: h, period: ws, why: `Done ${n} of ${h.per_week_target || 3} this week` }));
  }
  return [];
}

function outcome(recipe, c) {
  const p = recipe.action_params || {};
  const title = c.record.title || 'Untitled';
  if (FLAGS[recipe.action]) {
    const msg = recipe.action === 'review_prompt' ? (p.text || '').replace(/\{title\}/g, title) : `${c.why}`;
    return { status: 'success', flag: FLAGS[recipe.action], flag_open: true, message: msg };
  }
  if (REVIEW.includes(recipe.action)) {
    const msg = recipe.action === 'propose_status' ? `Change status to ${p.status || '?'} · ${c.why}`
      : recipe.action === 'create_task' ? `Create task “${(p.text || 'Follow up on {title}').replace(/\{title\}/g, title)}” · ${c.why}`
      : `Create follow-up “Follow up: ${title}” due in 3 days · ${c.why}`;
    return { status: 'pending_review', flag: 'none', flag_open: false, message: msg };
  }
  return { status: 'skipped', flag: 'none', flag_open: false, message: "This action doesn't apply to goals or habits" };
}

async function evaluateRecipes(db, recipes, D, dryRun) {
  const preview = [];
  let created = 0;
  for (const recipe of recipes) {
    const list = (await candidates(db, recipe, D)).filter((c) => matches(recipe, c.record));
    const rows = list.map((c) => ({
      recipe_id: recipe.id, recipe_name: recipe.name, trigger: recipe.trigger, action: recipe.action,
      record_type: c.type, record_id: c.record.id, record_title: c.record.title || 'Untitled',
      ...outcome(recipe, c),
      run_key: `${recipe.id}:${c.record.id}:${recipe.trigger}:${c.period}`,
      source: 'nightly', digest_date: D, owner_id: recipe.created_by_id, workspace: recipe.workspace || 'personal',
    }));
    if (dryRun) { preview.push(...rows); continue; }
    if (!rows.length) continue;
    const existing = new Set((await allPages(db.AutomationRun, { run_key: { $in: rows.map((r) => r.run_key) } }, { fields: ['run_key'] })).map((r) => r.run_key));
    const fresh = rows.filter((r) => !existing.has(r.run_key));
    if (!fresh.length) continue;
    await db.AutomationRun.bulkCreate(fresh);
    created += fresh.length;
    await db.AutomationRecipe.update(recipe.id, { last_run: new Date().toISOString(), last_result: `nightly: ${fresh.length} event(s)`, run_count: (recipe.run_count || 0) + fresh.length });
  }
  return { preview, created };
}

async function buildDigests(base44, db, D) {
  const runs = await allPages(db.AutomationRun, { digest_date: D, status: { $in: DIGEST_STATUSES } });
  const groups = {};
  runs.forEach((r) => {
    const owner = r.owner_id || r.created_by_id;
    const key = `${owner}:${r.workspace || 'personal'}:${D}`;
    (groups[key] ||= { owner, workspace: r.workspace || 'personal', runs: [] }).runs.push(r);
  });
  let digests = 0, emails = 0;
  for (const [digest_key, g] of Object.entries(groups)) {
    const items = g.runs.slice(0, 50).map((r) => ({ recipe_name: r.recipe_name, record_type: r.record_type, record_id: r.record_id, record_title: r.record_title, status: r.status, message: r.message, source: r.source || 'live' }));
    const data = { digest_key, owner_id: g.owner, date: D, total: g.runs.length, pending: g.runs.filter((r) => r.status === 'pending_review').length, items, workspace: g.workspace };
    const [existing] = (await db.DailyDigest.filter({ digest_key }, { limit: 1 })).items;
    if (existing?.emailed) continue;
    const digest = existing ? await db.DailyDigest.update(existing.id, data) : await db.DailyDigest.create({ ...data, emailed: false });
    digests++;
    if (g.workspace !== 'personal') continue; // demo digests are in-app only
    const [owner] = await db.User.filter({ id: g.owner });
    if (!owner?.email) continue;
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: owner.email,
      template_name: 'DailyDigest',
      variables: {
        first_name: (owner.full_name || 'there').split(' ')[0], date: D, total: String(data.total), pending: String(data.pending),
        highlights: items.slice(0, 8).map((i) => `${i.record_title}: ${i.message}`).join(' • ') + (items.length > 8 ? ` • and ${items.length - 8} more` : ''),
      },
    });
    await db.DailyDigest.update(digest.id || existing.id, { emailed: true });
    emails++;
  }
  return { digests, emails };
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    const body = await req.json().catch(() => ({}));
    const db = base44.asServiceRole.entities;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(body.date || '') ? body.date : new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(Date.now() - 864e5));

    // Preview: owner-only, read-only.
    if (body.dry_run) {
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const [recipe] = (await db.AutomationRecipe.filter({ id: String(body.recipe_id || '') }, { limit: 1 })).items;
      if (!recipe || recipe.created_by_id !== user.id || !NIGHTLY.includes(recipe.trigger)) return Response.json({ error: 'Recipe not found' }, { status: 404 });
      const { preview } = await evaluateRecipes(db, [recipe], date, true);
      return Response.json({ date, results: preview.slice(0, 25) });
    }

    if (user && user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const marked = await markMissed(db, date);
    const recipes = await allPages(db.AutomationRecipe, { enabled: true, trigger: { $in: NIGHTLY } });
    const { created } = await evaluateRecipes(db, recipes, date, false);
    const digest = await buildDigests(base44, db, date);
    return Response.json({ date, marked, recipes: recipes.length, runs_created: created, ...digest });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}