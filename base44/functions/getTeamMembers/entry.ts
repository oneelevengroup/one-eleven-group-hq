import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const users = await base44.asServiceRole.entities.User.list();
    // Return only display-relevant fields to keep the payload small and avoid exposing auth internals.
    const roster = users.map(u => ({
      id: u.id,
      display_name: u.display_name || '',
      full_name: u.full_name || '',
      email: u.email || '',
      role: u.role || 'user',
      calendar_embed_src: u.calendar_embed_src || '',
    }));
    return Response.json(roster);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});