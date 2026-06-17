import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CONNECTOR_ID = '6a32c760705912ec06ba2cc2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    console.log('User ID:', user.id);
    console.log('Connector ID:', CONNECTOR_ID);

    // Get the current app user's connection
    const connection = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);
    
    console.log('Connection obtained:', !!connection);
    console.log('Has accessToken:', !!connection?.accessToken);
    console.log('Token prefix:', connection?.accessToken?.substring(0, 20) + '...');

    const { accessToken } = connection;

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

    console.log('Calling Google Calendar API...');

    const todayRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(startOfDay)}&timeMax=${encodeURIComponent(endOfDay)}&singleEvents=true&orderBy=startTime&maxResults=50`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    console.log('API Response status:', todayRes.status);

    if (!todayRes.ok) {
      const errBody = await todayRes.text();
      console.log('API Error body:', errBody);
      return Response.json({ connected: false, error: `Calendar API error ${todayRes.status}: ${errBody}` }, { status: 500 });
    }

    const todayData = await todayRes.json();

    const events_today = (todayData.items || []).map(e => ({
      id: e.id,
      summary: e.summary || 'Busy',
      start: e.start?.dateTime || e.start?.date || null,
      end: e.end?.dateTime || e.end?.date || null,
      allDay: !e.start?.dateTime,
    }));

    return Response.json({ connected: true, events_today, events_this_week: [] });
  } catch (error) {
    console.log('Function error:', error.message);
    return Response.json({ connected: false, error: error.message });
  }
});