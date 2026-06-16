import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const leads = await base44.asServiceRole.entities.Lead.filter({});

    const stale = leads.filter(l =>
      l.status !== 'Cold' &&
      l.status !== 'Contract Sent' &&
      new Date(l.updated_date) < new Date(twoWeeksAgo)
    );

    for (const lead of stale) {
      await base44.asServiceRole.entities.Lead.update(lead.id, { status: 'Cold' });
    }

    return Response.json({ success: true, coldLeads: stale.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});