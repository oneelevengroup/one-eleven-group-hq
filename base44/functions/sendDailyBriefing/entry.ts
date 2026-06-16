import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all users
    const users = await base44.asServiceRole.entities.User.list();

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    let sent = 0;
    let skipped = 0;

    for (const user of users) {
      const pref = user.notification_preference || 'email';
      if (pref === 'none' || pref === 'sms') {
        skipped++;
        continue;
      }

      // Get tasks assigned to this user
      const allTasks = await base44.asServiceRole.entities.Task.list();
      const myTasks = allTasks.filter(t => t.assigned_to === user.id && t.status !== 'Completed');

      const dueToday = myTasks.filter(t => {
        if (!t.due_date) return false;
        return t.due_date === todayStr;
      });

      const highPriority = myTasks.filter(t => ['High', 'Urgent'].includes(t.priority) && !dueToday.find(d => d.id === t.id));

      // Get clients for task context
      const clients = await base44.asServiceRole.entities.Client.list();

      // Build email content
      let body = `<div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #f8fafc;">`;
      body += `<div style="background: #0F1226; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">`;
      body += `<h1 style="color: #A5F8D3; margin: 0; font-size: 22px; font-weight: 800;">ONE ELEVEN GROUP HQ</h1>`;
      body += `<p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 13px;">Daily Briefing — ${dayName}</p>`;
      body += `</div>`;

      body += `<div style="background: #ffffff; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">`;
      body += `<p style="color: #0F1226; font-size: 15px; margin: 0 0 20px;">Good morning, <strong>${user.full_name || 'Team Member'}</strong>! Here's your briefing for today.</p>`;

      // Due Today
      body += `<h2 style="color: #0F1226; font-size: 16px; font-weight: 700; margin: 0 0 12px; border-bottom: 2px solid #A5F8D3; padding-bottom: 6px;">📋 Due Today</h2>`;
      if (dueToday.length === 0) {
        body += `<p style="color: #64748b; font-size: 14px; margin: 0 0 16px;">Nothing due today — great job staying ahead!</p>`;
      } else {
        body += `<ul style="padding-left: 20px; margin: 0 0 16px;">`;
        for (const task of dueToday) {
          const client = clients.find(c => c.id === task.client_id);
          body += `<li style="margin-bottom: 8px; font-size: 14px; color: #0F1226;"><strong>${task.name}</strong> ${task.priority === 'Urgent' ? '🔴' : task.priority === 'High' ? '🟠' : ''}${client ? ` — <span style="color: #64748b;">${client.name}</span>` : ''}</li>`;
        }
        body += `</ul>`;
      }

      // Top Priorities
      body += `<h2 style="color: #0F1226; font-size: 16px; font-weight: 700; margin: 20px 0 12px; border-bottom: 2px solid #A5F8D3; padding-bottom: 6px;">🔥 Top Priorities</h2>`;
      if (highPriority.length === 0) {
        body += `<p style="color: #64748b; font-size: 14px; margin: 0 0 16px;">No high-priority items — enjoy the clear deck!</p>`;
      } else {
        body += `<ul style="padding-left: 20px; margin: 0 0 16px;">`;
        for (const task of highPriority.slice(0, 5)) {
          const client = clients.find(c => c.id === task.client_id);
          body += `<li style="margin-bottom: 8px; font-size: 14px; color: #0F1226;"><strong>${task.name}</strong> ${task.priority === 'Urgent' ? '🔴' : '🟠'}${task.due_date ? ` — Due ${new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}${client ? ` <span style="color: #64748b;">(${client.name})</span>` : ''}</li>`;
        }
        body += `</ul>`;
      }

      // Team Meeting Reminder (Monday only)
      const isMonday = today.getDay() === 1;
      let meetingReminder = '';
      if (isMonday) {
        const meetings = await base44.asServiceRole.entities.TeamMeeting.list('-date');
        const upcomingMeeting = meetings.find(m => {
          if (!m.date) return false;
          const meetingDate = new Date(m.date + 'T12:00:00');
          const diff = (meetingDate - today) / (1000 * 60 * 60 * 24);
          return diff >= 0 && diff <= 7;
        });
        if (upcomingMeeting) {
          const meetingDay = new Date(upcomingMeeting.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
          meetingReminder = `<div style="background: #fef3c7; border-left: 3px solid #f59e0b; border-radius: 8px; padding: 16px; margin-top: 20px;">`;
          meetingReminder += `<h2 style="color: #b45309; font-size: 15px; font-weight: 700; margin: 0 0 8px;">📢 Team Meeting Tomorrow — 11:00 AM</h2>`;
          meetingReminder += `<p style="color: #78350f; font-size: 13px; margin: 0 0 8px;"><strong>${upcomingMeeting.title}</strong> — ${meetingDay}</p>`;
          meetingReminder += `<p style="color: #78350f; font-size: 13px; margin: 0;">Please submit your <strong>🔥 Hot Topics</strong> and <strong>🏆 Weekly Win</strong> before the meeting. <a href="https://one-eleven-group-hq.base44.app/team-meetings" style="color: #b45309; font-weight: 600;">Submit here →</a></p>`;
          meetingReminder += `</div>`;
        }
      }

      // Summary
      const totalOpen = myTasks.length;
      body += `<div style="background: #f1f5f9; border-radius: 8px; padding: 12px 16px; margin-top: 20px;">`;
      body += `<p style="margin: 0; font-size: 13px; color: #475569;"><strong>📊 Your Snapshot:</strong> ${totalOpen} open task${totalOpen !== 1 ? 's' : ''}, ${dueToday.length} due today, ${highPriority.length} high priority</p>`;
      body += `</div>`;

      if (meetingReminder) body += meetingReminder;

      body += `<p style="color: #94a3b8; font-size: 12px; margin: 16px 0 0; text-align: center;">View full dashboard → <a href="https://one-eleven-group-hq.base44.app" style="color: #A5F8D3;">One Eleven Group HQ</a></p>`;
      body += `</div></div>`;

      // Send email
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          subject: `☀️ Daily Briefing — ${dayName}`,
          body: body,
          from_name: 'One Eleven Group HQ',
        });
        sent++;
      } catch (emailErr) {
        console.error(`Failed to send to ${user.email}:`, emailErr.message);
      }
    }

    return Response.json({ sent, skipped, total: users.length, date: todayStr });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});