import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const [responsibilities, clients, users] = await Promise.all([
      base44.asServiceRole.entities.Responsibility.list(),
      base44.asServiceRole.entities.Client.list(),
      base44.asServiceRole.entities.User.list(),
    ]);

    const active = responsibilities.filter(r => r.active);
    const clientName = (id) => (clients.find(c => c.id === id) || {}).name || 'No client';

    // Week range (Mon-Sun) for "this week" completion check
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = (day + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const isDoneThisWeek = (r) => {
      if (!r.last_completed_date) return false;
      const c = new Date(r.last_completed_date);
      return c >= monday && c <= sunday;
    };

    // Group active responsibilities by assigned user
    const byUser = {};
    for (const r of active) {
      if (!byUser[r.assigned_to]) byUser[r.assigned_to] = [];
      byUser[r.assigned_to].push(r);
    }

    let sent = 0;
    for (const [userId, items] of Object.entries(byUser)) {
      const u = users.find(x => x.id === userId);
      if (!u || !u.email) continue;
      if (u.notification_preference === 'none') continue;

      const pending = items.filter(r => !isDoneThisWeek(r));
      const done = items.filter(r => isDoneThisWeek(r));

      const rows = items.map(r => {
        const status = isDoneThisWeek(r) ? '✅ Done this week' : '⏳ Pending';
        const last = r.last_completed_date ? new Date(r.last_completed_date).toLocaleDateString() : 'never';
        return `<tr>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;">${r.name}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;">${clientName(r.client_id)}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;">${r.day_of_week}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;">${status}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;">${last}</td>
        </tr>`;
      }).join('');

      const body = `<div style="font-family:sans-serif;max-width:600px;margin:auto;color:#1a1a2e;">
        <h2 style="color:#1a1a2e;">Weekly Accountability — ${u.full_name || ''}</h2>
        <p>Here's your ongoing responsibilities summary for this week:</p>
        <p><strong>${done.length}</strong> completed · <strong>${pending.length}</strong> pending</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="text-align:left;background:#f5f7fa;">
              <th style="padding:6px 10px;">Responsibility</th>
              <th style="padding:6px 10px;">Client</th>
              <th style="padding:6px 10px;">Due Day</th>
              <th style="padding:6px 10px;">Status</th>
              <th style="padding:6px 10px;">Last Done</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        ${pending.length > 0 ? `<p style="margin-top:16px;color:#b45309;">⚠️ You have ${pending.length} pending responsibilit${pending.length === 1 ? 'y' : 'ies'} this week. Please complete them by their due day.</p>` : `<p style="margin-top:16px;color:#15803d;">🎉 All caught up this week — great work!</p>`}
        <p style="margin-top:20px;font-size:12px;color:#888;">One Eleven Group HQ · Ongoing Responsibilities</p>
      </div>`;

      await base44.integrations.Core.SendEmail({
        to: u.email,
        subject: `Weekly Accountability — ${pending.length} pending responsibilit${pending.length === 1 ? 'y' : 'ies'}`,
        body,
      });
      sent++;
    }

    return Response.json({ success: true, sent, usersWithResponsibilities: Object.keys(byUser).length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});