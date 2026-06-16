import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const users = await base44.asServiceRole.entities.User.list('full_name', 200);

    for (const user of users) {
      const pref = user.notification_preference || 'email';
      if (pref === 'none') continue;

      const tasks = await base44.asServiceRole.entities.Task.filter({ assigned_to: user.id }, '-priority', 100);

      const today = new Date().toISOString().slice(0, 10);
      const todayTasks = tasks.filter(t => t.due_date === today && t.status !== 'Done');
      const highPriority = tasks.filter(t => (t.priority === 'High' || t.priority === 'Urgent') && t.status !== 'Done');
      const overdue = tasks.filter(t => t.due_date && t.due_date < today && t.status !== 'Done');

      if (todayTasks.length === 0 && highPriority.length === 0 && overdue.length === 0) continue;

      const lines = [
        `Good morning, ${user.full_name || 'team member'}! Here's your One Eleven Group HQ briefing for today.`,
        '',
      ];

      if (overdue.length > 0) {
        lines.push(`⚠️ OVERDUE (${overdue.length}):`);
        overdue.forEach(t => lines.push(`  • ${t.name} — Due: ${t.due_date}`));
        lines.push('');
      }

      if (todayTasks.length > 0) {
        lines.push(`📋 DUE TODAY (${todayTasks.length}):`);
        todayTasks.forEach(t => lines.push(`  • ${t.name} [${t.priority}]`));
        lines.push('');
      }

      if (highPriority.length > 0) {
        lines.push(`🔴 HIGH / URGENT PRIORITY (${highPriority.length}):`);
        highPriority.slice(0, 5).forEach(t => lines.push(`  • ${t.name} [${t.priority}${t.due_date ? ', Due: ' + t.due_date : ''}]`));
        lines.push('');
      }

      lines.push('View your full task list: log in to One Eleven Group HQ.');
      lines.push('— The One Eleven Group HQ Team');

      const body = lines.join('\n');

      if (pref === 'email' || pref === 'both') {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: user.email,
            subject: '☀️ Morning Briefing — One Eleven Group HQ',
            body,
            from_name: 'One Eleven Group HQ',
          });
        } catch (e) {
          console.error(`Failed to email ${user.email}:`, e.message);
        }
      }

      if (pref === 'sms' || pref === 'both') {
        console.log(`SMS to ${user.phone_number || user.email}: daily briefing (SMS not configured)`);
      }
    }

    return Response.json({ success: true, users_processed: users.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});