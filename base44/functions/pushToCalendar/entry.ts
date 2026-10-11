import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
const TAG = { private: { pkos: '1' } }; // marks events we created so the importer skips them

// Next Monday (or today if Monday), YYYY-MM-DD.
function nextMonday(today) {
  const d = new Date(today + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + ((8 - d.getUTCDay()) % 7));
  return d.toISOString().slice(0, 10);
}
const plusDay = (s) => { const d = new Date(s + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); };

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const workspace = body.workspace === 'demo' ? 'demo' : 'personal';
    const today = body.today || new Date().toISOString().slice(0, 10);

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
    const send = async (method, url, event) => {
      const res = await fetch(url, { method, headers, body: JSON.stringify(event), signal: AbortSignal.timeout(10000) });
      if (res.status === 404 || res.status === 410) return null; // event was deleted in Google, recreate
      if (!res.ok) throw new Error(`Calendar error ${res.status}`);
      return res.json();
    };
    const upsertEvent = async (id, event) =>
      (id && await send('PATCH', `${API}/${id}`, event)) || await send('POST', API, event);

    // Open, dated tasks that didn't come from the calendar itself.
    const tasks = await base44.entities.Task.filter(
      { workspace, status: { $ne: 'done' }, due_date: { $gte: today }, calendar_event_id: { $exists: false } },
      '-due_date', 100);
    const updates = [];
    for (let i = 0; i < tasks.length; i += 6) {
      const batch = tasks.slice(i, i + 6);
      const results = await Promise.allSettled(batch.map((t) => upsertEvent(t.pushed_event_id, {
        summary: `✅ ${t.title}`, description: t.description || 'Task deadline from Smart PKOS',
        start: { date: t.due_date }, end: { date: plusDay(t.due_date) }, extendedProperties: TAG,
        transparency: 'transparent',
      })));
      results.forEach((r, j) => {
        if (r.status === 'fulfilled' && r.value?.id !== batch[j].pushed_event_id) updates.push({ id: batch[j].id, pushed_event_id: r.value.id });
      });
    }
    if (updates.length) await base44.entities.Task.bulkUpdate(updates);

    // One weekly recurring "Goal check-in" event on Mondays, if the user has active goals.
    let checkin = false;
    const activeGoals = await base44.entities.Goal.filter({ workspace, status: 'Active' }, '-updated_date', 20);
    if (activeGoals.length) {
      const start = nextMonday(today);
      const ev = await upsertEvent(user.checkin_event_id, {
        summary: '🎯 Weekly goal check-in',
        description: 'Goals: ' + activeGoals.map((g) => g.title).join(', '),
        start: { date: start }, end: { date: plusDay(start) },
        recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=MO'], extendedProperties: TAG, transparency: 'transparent',
      });
      if (ev.id !== user.checkin_event_id) await base44.auth.updateMe({ checkin_event_id: ev.id });
      checkin = true;
    }
    const failed = tasks.length - (updates.length + tasks.filter((t) => t.pushed_event_id).length);
    return Response.json({ tasks: tasks.length, checkin, failed: Math.max(failed, 0) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}