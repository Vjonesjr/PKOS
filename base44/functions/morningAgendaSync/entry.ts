import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
const TZ = 'America/New_York';

// Pushes today's open tasks (planned for today or due today) to Google Calendar as an agenda.
// Runs from the morning workflow (admin) — idempotent via Task.agenda_event_id.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const today = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
    const tasks = await base44.asServiceRole.entities.Task.filter({
      workspace: 'personal', status: { $ne: 'done' }, archived: { $ne: true }, calendar_event_id: { $exists: false },
      $or: [{ today_date: today }, { due_date: today }],
    }, 'title', 50);

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
    const send = async (method, url, event) => {
      const res = await fetch(url, { method, headers, body: JSON.stringify(event), signal: AbortSignal.timeout(10000) });
      if (res.status === 404 || res.status === 410) return null; // deleted in Google → recreate
      if (!res.ok) throw new Error(`Calendar error ${res.status}`);
      return res.json();
    };

    const updates = [];
    for (let i = 0; i < tasks.length; i += 6) {
      const batch = tasks.slice(i, i + 6);
      const results = await Promise.allSettled(batch.map((t) => {
        const timed = /^\d{2}:\d{2}$/.test(t.scheduled_time || '');
        const event = {
          summary: `📋 ${t.title}`, description: t.description || 'Today in Smart PKOS',
          extendedProperties: { private: { pkos: '1' } }, // importer skips these
          ...(timed
            ? { start: { dateTime: `${today}T${t.scheduled_time}:00`, timeZone: TZ }, end: { dateTime: `${today}T${t.scheduled_time}:00`, timeZone: TZ } }
            : { start: { date: today }, end: { date: today }, transparency: 'transparent' }),
        };
        if (!timed) { const d = new Date(today + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1); event.end.date = d.toISOString().slice(0, 10); }
        else { const [h, m] = t.scheduled_time.split(':').map(Number); const e = h * 60 + m + 30; event.end.dateTime = `${today}T${String(Math.floor(e / 60) % 24).padStart(2, '0')}:${String(e % 60).padStart(2, '0')}:00`; }
        return (async () => (t.agenda_event_id && await send('PATCH', `${API}/${t.agenda_event_id}`, event)) || send('POST', API, event))();
      }));
      results.forEach((r, j) => {
        if (r.status === 'fulfilled' && r.value?.id !== batch[j].agenda_event_id) updates.push({ id: batch[j].id, agenda_event_id: r.value.id });
      });
    }
    if (updates.length) await base44.asServiceRole.entities.Task.bulkUpdate(updates);
    return Response.json({ date: today, tasks: tasks.length, synced: updates.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}