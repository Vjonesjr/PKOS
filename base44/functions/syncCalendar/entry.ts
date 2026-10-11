import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const workspace = body.workspace === 'demo' ? 'demo' : 'personal';
    const days = Math.min(Math.max(Number(body.days) || 14, 1), 60);
    const today = body.today || new Date().toISOString().slice(0, 10);

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const params = new URLSearchParams({
      timeMin: new Date().toISOString(),
      timeMax: new Date(Date.now() + days * 864e5).toISOString(),
      singleEvents: 'true', orderBy: 'startTime', maxResults: '100',
    });
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return Response.json({ error: `Calendar error ${res.status}` }, { status: 502 });
    const events = ((await res.json()).items || []).filter((e) => e.status !== 'cancelled' && e.extendedProperties?.private?.pkos !== '1');

    const ids = events.map((e) => e.id);
    const existing = ids.length ? await base44.entities.Task.filter({ workspace, calendar_event_id: { $in: ids } }) : [];
    const byId = Object.fromEntries(existing.map((t) => [t.calendar_event_id, t]));

    const toCreate = [], toUpdate = [];
    for (const e of events) {
      const start = e.start?.dateTime || e.start?.date;
      const date = start.slice(0, 10);
      const time = e.start?.dateTime ? start.slice(11, 16) : 'All day';
      const data = {
        title: e.summary || '(No title)',
        description: [`📅 ${date} · ${time}`, e.location && `📍 ${e.location}`, e.description].filter(Boolean).join('\n'),
        due_date: date, scheduled_time: time,
        ...(date === today ? { today_date: today } : {}),
      };
      const t = byId[e.id];
      if (t) toUpdate.push({ id: t.id, ...data });
      else toCreate.push({ ...data, calendar_event_id: e.id, workspace, status: 'todo', priority: 'medium' });
    }
    if (toCreate.length) await base44.entities.Task.bulkCreate(toCreate);
    if (toUpdate.length) await base44.entities.Task.bulkUpdate(toUpdate);
    return Response.json({ created: toCreate.length, updated: toUpdate.length, total: events.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}