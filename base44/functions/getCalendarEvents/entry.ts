import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CONNECTOR_ID = '6a32c760705912ec06ba2cc2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Use the platform SHARED connector (authorized via dashboard)
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');

    // Use the user's stored calendar ID, or fall back to primary
    const calendarId = user.google_calendar_id || 'primary';
    const encodedCalId = encodeURIComponent(calendarId);

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
    const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).toISOString();

    const [todayRes, weekRes] = await Promise.all([
      fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodedCalId}/events?timeMin=${encodeURIComponent(startOfDay)}&timeMax=${encodeURIComponent(endOfDay)}&singleEvents=true&orderBy=startTime&maxResults=50`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      }),
      fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodedCalId}/events?timeMin=${encodeURIComponent(startOfDay)}&timeMax=${encodeURIComponent(endOfWeek)}&singleEvents=true&orderBy=startTime&maxResults=100`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
    ]);

    if (!todayRes.ok) {
      const err = await todayRes.json();
      return Response.json({ connected: false, error: err.error?.message || `Calendar API error ${todayRes.status}` });
    }

    const todayData = await todayRes.json();
    const weekData = await weekRes.json();

    const events_today = (todayData.items || []).map(e => ({
      id: e.id,
      summary: e.summary || 'Busy',
      start: e.start?.dateTime || e.start?.date || null,
      end: e.end?.dateTime || e.end?.date || null,
      allDay: !e.start?.dateTime,
    }));

    const events_this_week = (weekData.items || []).map(e => ({
      id: e.id,
      summary: e.summary || 'Busy',
      start: e.start?.dateTime || e.start?.date || null,
      end: e.end?.dateTime || e.end?.date || null,
    }));

    return Response.json({ connected: true, events_today, events_this_week, calendar_id: calendarId });
  } catch (error) {
    return Response.json({ connected: false, error: error.message });
  }
});