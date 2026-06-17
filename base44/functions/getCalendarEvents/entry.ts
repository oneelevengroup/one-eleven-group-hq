import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CONNECTOR_ID = '6a32c760705912ec06ba2cc2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);
      accessToken = conn.accessToken;
    } catch (connErr) {
      return Response.json({ connected: false, error: connErr.message }, { status: 200 });
    }

    // Fetch today's events from primary calendar
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

    const [todayRes, weekRes] = await Promise.all([
      fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(startOfDay)}&timeMax=${encodeURIComponent(endOfDay)}&singleEvents=true&orderBy=startTime&maxResults=50`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      }),
      fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(startOfDay)}&timeMax=${encodeURIComponent(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).toISOString())}&singleEvents=true&orderBy=startTime&maxResults=100`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
    ]);

    if (!todayRes.ok) {
      const errBody = await todayRes.text();
      return Response.json({ connected: true, error: `Calendar API error ${todayRes.status}: ${errBody}` }, { status: 500 });
    }

    const todayData = await todayRes.json();
    const weekData = await weekRes.json();

    // Calculate free blocks in working hours (9am-6pm) for today
    const workingStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);
    const workingEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0);

    const events = (todayData.items || []).map(e => ({
      id: e.id,
      summary: e.summary || 'Busy',
      start: e.start?.dateTime || e.start?.date || null,
      end: e.end?.dateTime || e.end?.date || null,
      location: e.location || null,
      description: e.description || null,
    }));

    const freeBlocks = [];
    let cursor = new Date(workingStart);

    const sortedEvents = events
      .filter(e => e.start && e.end)
      .map(e => ({ start: new Date(e.start), end: new Date(e.end) }))
      .sort((a, b) => a.start - b.start);

    for (const ev of sortedEvents) {
      if (ev.start > cursor) {
        const diffMs = ev.start - cursor;
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin >= 30) {
          freeBlocks.push({
            start: cursor.toISOString(),
            end: ev.start.toISOString(),
            duration_minutes: diffMin,
          });
        }
      }
      if (ev.end > cursor) cursor = new Date(ev.end);
    }

    if (workingEnd > cursor) {
      const diffMs = workingEnd - cursor;
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin >= 30) {
        freeBlocks.push({
          start: cursor.toISOString(),
          end: workingEnd.toISOString(),
          duration_minutes: diffMin,
        });
      }
    }

    return Response.json({
      connected: true,
      events_today: events,
      free_blocks_today: freeBlocks,
      events_this_week: (weekData.items || []).map(e => ({
        id: e.id,
        summary: e.summary || 'Busy',
        start: e.start?.dateTime || e.start?.date || null,
        end: e.end?.dateTime || e.end?.date || null,
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});