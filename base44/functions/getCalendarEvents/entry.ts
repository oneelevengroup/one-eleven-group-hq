import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CALENDAR_CONNECTOR_ID = '6a31a2611d8d2e3bdb3a55ce';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CALENDAR_CONNECTOR_ID);
      accessToken = conn.accessToken;
    } catch {
      return Response.json({ events: [], connected: false });
    }

    const now = new Date();
    const timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const timeMax = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).toISOString();

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&maxResults=50&singleEvents=true&orderBy=startTime`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok) return Response.json({ events: [], connected: true, error: 'Failed to fetch events' });

    const data = await res.json();
    const events = (data.items || []).map(evt => ({
      id: evt.id,
      summary: evt.summary || '(No title)',
      start: evt.start?.dateTime || evt.start?.date || null,
      end: evt.end?.dateTime || evt.end?.date || null,
      allDay: !evt.start?.dateTime,
    }));

    return Response.json({ events, connected: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});