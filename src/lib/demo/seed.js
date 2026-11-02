import { seedDemoCatalog } from './catalog.js';
import { addDemoExamples } from './supplement.js';
export const DEMO_VERSION = '2026-10-26-expanded-2';
const flights = new Map();
const label = r => String(r.title || r.decision || r.learned || r.name || r.front || '').trim().toLowerCase();
function identity(type, r) {
  if (type === 'Link') return [r.source_type, r.source_id, r.target_type, r.target_id].join('|');
  if (type === 'HabitLog') return [r.habit_id, r.date].join('|');
  if (type === 'GoalCheckin') return [r.goal_id, r.week_start].join('|');
  if (type === 'ReviewEntry') return [r.type, r.date, r.summary].join('|');
  if (type === 'AutomationRun') return r.run_key || [r.recipe_id, r.record_id, r.trigger, r.digest_date].join('|');
  if (type === 'Task') return [label(r), r.project_id || '', r.parent_task_id || ''].join('|');
  return label(r);
}
export function fillDemo(client, user, onProgress = () => {}) {
  if (!user?.id) return Promise.reject(new Error('Sign in to load the Demo workspace.'));
  if (flights.has(user.id)) return flights.get(user.id);
  const work = seed(client, user, onProgress).finally(() => flights.delete(user.id));
  flights.set(user.id, work);
  return work;
}
async function seed(client, user, onProgress) {
  const caches = new Map(), counts = {}, created = {};
  const ownQuery = { workspace: 'demo', created_by_id: user.id };
  async function rows(type) {
    if (!caches.has(type)) {
      const all = []; let cursor = null;
      do {
        const page = await client.entities[type].filter(ownQuery, { limit: 500, sort: '-created_date', cursor });
        if (!Array.isArray(page?.items)) throw new Error(`Could not read Demo ${type}. Please retry.`);
        all.push(...page.items.filter(r => r.workspace === 'demo' && r.created_by_id === user.id));
        cursor = page.next_cursor;
      } while (cursor);
      caches.set(type, all);
    }
    return caches.get(type);
  }
  const entity = type => ({
    async bulkCreate(input) {
      const list = await rows(type), byKey = new Map(list.map(r => [identity(type, r), r]));
      const output = [], pending = [], pendingIndex = new Map();
      for (const raw of input) {
        if (raw.workspace !== 'demo') throw new Error('Sample data must stay in the Demo workspace.');
        const payload = Object.fromEntries(Object.entries({ ...raw, ...(type === 'AutomationRecipe' ? { enabled: false } : {}) }).filter(([,v]) => v !== undefined));
        const key = identity(type, payload);
        if (!key) throw new Error(`Demo ${type} is missing its identity.`);
        if (byKey.has(key)) output.push(byKey.get(key));
        else { if (!pendingIndex.has(key)) { pendingIndex.set(key, pending.length); pending.push(payload); } output.push({ pending: key }); }
      }
      for (let start = 0; start < pending.length; start += 50) {
        const slice = pending.slice(start, start + 50), saved = await client.entities[type].bulkCreate(slice);
        if (!Array.isArray(saved) || saved.length !== slice.length) throw new Error(`Demo ${type} only partly loaded. Retry to fill missing examples.`);
        saved.forEach((r, i) => { byKey.set(identity(type, slice[i]), r); list.push(r); });
        created[type] = (created[type] || 0) + saved.length;
        onProgress({ entity: type, created: Object.values(created).reduce((a,b) => a+b,0) });
      }
      counts[type] = list.length;
      return output.map(r => r.pending ? byKey.get(r.pending) : r);
    },
    async create(payload) { return (await this.bulkCreate([payload]))[0]; },
    async bulkUpdate(patches) {
      const list = await rows(type);
      for (const patch of patches) {
        const existing = list.find(r => r.id === patch.id);
        if (!existing) throw new Error('Demo update could not find its matching record.');
        const missing = Object.fromEntries(Object.entries(patch).filter(([k,v]) => k !== 'id' && v != null && (existing[k] == null || existing[k] === '')));
        if (Object.keys(missing).length) { await client.entities[type].update(existing.id, missing); Object.assign(existing, missing); }
      }
    },
    async filter(query, options) {
      if (query.workspace !== 'demo') throw new Error('Invalid Demo query.');
      const list = (await rows(type)).filter(r => Object.entries(query).every(([k,v]) => r[k] === v));
      const sorted = [...list]; if (options?.sort) { const field=options.sort.replace(/^-/,''), direction=options.sort.startsWith('-')?-1:1; sorted.sort((a,b)=>String(a[field]||'').localeCompare(String(b[field]||''))*direction); }
      return { items: sorted.slice(0, options?.limit || sorted.length) };
    },
  });
  const safe = { auth: { me: async () => user }, entities: new Proxy({}, { get: (_,type) => entity(type) }) };
  await seedDemoCatalog(safe);
  await addDemoExamples(safe, user);
  return { version: DEMO_VERSION, counts, created, total: Object.values(counts).reduce((a,b)=>a+b,0) };
}
