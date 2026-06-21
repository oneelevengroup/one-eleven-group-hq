import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ISO week id for the America/New_York local date, e.g. "2026-W25".
const getETWeekId = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(date);
  const y = Number(parts.find(p => p.type === 'year').value);
  const m = Number(parts.find(p => p.type === 'month').value);
  const d = Number(parts.find(p => p.type === 'day').value);
  const local = new Date(Date.UTC(y, m - 1, d));
  const dayNum = local.getUTCDay() || 7;
  local.setUTCDate(local.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(local.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((local - yearStart) / 86400000) + 1) / 7);
  return `${local.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const [responsibilities, clients, users] = await Promise.all([
      base44.asServiceRole.entities.OngoingResponsibility.list(),
      base44.asServiceRole.entities.Client.list(),
      base44.asServiceRole.entities.User.list(),
    ]);

    const currentWeek = getETWeekId();
    const clientName = (id) => (clients.find(c => c.id === id) || {}).name || 'No client';
    const incomplete = responsibilities.filter(r => r.active && r.completed_week !== currentWeek);

    // Group incomplete by assigned staff email
    const byUser = {};
    for (const r of incomplete) {
      if (!byUser[r.assigned_to]) byUser[r.assigned_to] = [];
      byUser[r.assigned_to].push(r);
    }

    let sent = 0;
    for (const [email, items] of Object.entries(byUser)) {
      const u = users.find(x => x.email === email);
      if (!u || !u.email) continue;

      const rows = items.map(r =>
        `<li style="margin-bottom:6px;font-size:14px;color:#0F1226;"><strong>${r.description}</strong> <span style="color:#64748b;">— ${clientName(r.client_id)}</span></li>`
      ).join('');

      const body = `<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;padding:30px;background:#f8fafc;">
        <div style="background:#0F1226;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="color:#A5F8D3;margin:0;font-size:20px;font-weight:800;">ONE ELEVEN GROUP HQ</h1>
          <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:13px;">Weekly Responsibilities Reminder — Week ${currentWeek}</p>
        </div>
        <div style="background:#ffffff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none;">
          <p style="color:#0F1226;font-size:15px;margin:0 0 8px;">Hi <strong>${u.full_name || 'there'}</strong>,</p>
          <p style="color:#0F1226;font-size:15px;margin:0 0 16px;">Friendly reminder — you still have <strong>${items.length}</strong> ongoing responsibilit${items.length === 1 ? 'y' : 'ies'} to complete this week, due <strong>today by 5:00pm ET</strong>:</p>
          <ul style="padding-left:20px;margin:0 0 16px;">${rows}</ul>
          <p style="color:#b45309;font-size:14px;margin:0 0 16px;">⏰ Please mark each one complete in the HQ app before the 5pm deadline.</p>
          <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">Mark them done → <a href="https://one-eleven-group-hq.base44.app/responsibilities" style="color:#A5F8D3;">Ongoing Responsibilities</a></p>
        </div>
      </div>`;

      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: u.email,
          subject: `⏰ Reminder: ${items.length} responsibilit${items.length === 1 ? 'y' : 'ies'} due today by 5pm ET`,
          body,
          from_name: 'One Eleven Group HQ',
        });
        sent++;
      } catch (emailErr) {
        console.error(`Failed to send reminder to ${u.email}:`, emailErr.message);
      }
    }

    return Response.json({ success: true, sent, week: currentWeek, usersWithIncomplete: Object.keys(byUser).length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});