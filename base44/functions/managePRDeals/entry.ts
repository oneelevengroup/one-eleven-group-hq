import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify pr_access — the only users allowed to read/write PRDeal records
    if (!user.pr_access) {
      return Response.json({ error: 'Forbidden: PR access required' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'list') {
      const deals = await base44.asServiceRole.entities.PRDeal.list('-created_date');
      return Response.json({ deals });
    }

    if (action === 'create') {
      const deal = await base44.asServiceRole.entities.PRDeal.create(body.deal);
      return Response.json({ deal });
    }

    if (action === 'update') {
      const deal = await base44.asServiceRole.entities.PRDeal.update(body.id, body.deal);
      return Response.json({ deal });
    }

    if (action === 'delete') {
      await base44.asServiceRole.entities.PRDeal.delete(body.id);
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});