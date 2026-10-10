import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Nightly job: logs "missed" for every active habit that was due on the
// given day (default: yesterday, America/New_York) but has no check-in.
// per_week habits are excluded — any single day is optional for them.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const tz = 'America/New_York';
    const date = /^\d{4}-\d{2}-\d{2}$/.test(body.date || '')
      ? body.date
      : new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date(Date.now() - 864e5));
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    const db = base44.asServiceRole.entities;

    let cursor, marked = 0, checked = 0;
    do {
      const page = await db.Habit.filter({ active: true }, { limit: 500, cursor });
      cursor = page.has_more ? page.next_cursor : undefined;
      const due = page.items.filter((h) =>
        h.schedule_type !== 'per_week' &&
        (!h.start_date || h.start_date <= date) &&
        (h.schedule_type !== 'weekdays' || (h.weekdays || []).includes(weekday)));
      checked += due.length;
      if (!due.length) continue;

      const logs = await db.HabitLog.filter({ date, habit_id: { $in: due.map((h) => h.id) } }, { limit: 1000, fields: ['habit_id'] });
      const logged = new Set(logs.items.map((l) => l.habit_id));
      const missing = due.filter((h) => !logged.has(h.id)).map((h) => ({
        habit_id: h.id, date, status: 'missed', owner_id: h.created_by_id, workspace: h.workspace || 'personal',
      }));
      if (missing.length) await db.HabitLog.bulkCreate(missing);
      marked += missing.length;
    } while (cursor);

    return Response.json({ date, checked, marked });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}