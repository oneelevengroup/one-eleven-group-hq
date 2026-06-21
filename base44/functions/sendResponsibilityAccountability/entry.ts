import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Returns the ISO week id for the America/New_York local date, e.g. "2026-W25".
// Week runs Monday-Sunday and resets Monday 00:00 ET.
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
    const active = responsibilities.filter(r => r.active);
    const clientName = (id) => (clients.find(c => c.id === id) || {}).name || 'No client';
    const isDone = (r) => r.completed_week === currentWeek;

    // Group active responsibilities by assigned staff email
    const byUser = {};
    for (const r of active) {
      if (!byUser[r.assigned_to]) byUser[r.assigned_to] = [];
      byUser[r.assigned_to].push(r);
    }

    let sent = 0;
    for (const [email, items] of Object.entries(byUser)) {
      const u = users.find(x => x.email === email);
      if (!u || !u.email) continue;
      if (u.notification_preference === 'none') continue;

      const pending = items.filter(r => !isDone(r));
      const done = items.filter(r => isDone(r));

      const rows = items.map(r => {
        const status = isDone(r) ? '✅ Done this week' : '⏳ Pending';
        const last = r.completed_week || 'never';
        return `<tr>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;">${r.description}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;">${clientName(r.client_id)}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;">${status}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;">${last}</td>
        </tr>`;
      }).join('');

      const body = `<div style="font-family:sans-serif;max-width:600px;margin:auto;color:#1a1a2e;">
        <h2 style="color:#1a1a2e;">Weekly Accountability — ${u.full_name || ''}</h2>
        <p>Your ongoing responsibilities summary for week <strong>${currentWeek}</strong>:</p>
        <p><strong>${done.length}</strong> completed · <strong>${pending.length}</strong> pending</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="text-align:left;background:#f5f7fa;">
              <th style="padding:6px 10px;">Responsibility</th>
              <th style="padding:6px 10px;">Client</th>
              <th style="padding:6px 10px;">Status</th>
              <th style="padding:6px 10px;">Last Done</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        ${pending.length > 0 ? `<p style="margin-top:16px;color:#b45309;">⚠️ You have ${pending.length} pending responsibilit${pending.length === 1 ? 'y' : 'ies'} this week. Please mark them complete once done.</p>` : `<p style="margin-top:16px;color:#15803d;">🎉 All caught up this week — great work!</p>`}
        <p style="margin-top:20px;font-size:12px;color:#888;">One Eleven Group HQ · Ongoing Responsibilities</p>
      </div>`;

      await base44.integrations.Core.SendEmail({
        to: u.email,
        subject: `Weekly Accountability (${currentWeek}) — ${pending.length} pending`,
        body,
      });
      sent++;
    }

    return Response.json({ success: true, sent, week: currentWeek, usersWithResponsibilities: Object.keys(byUser).length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});