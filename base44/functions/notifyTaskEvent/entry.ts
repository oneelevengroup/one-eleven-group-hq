import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event, data, old_data } = body;

    // ── Scheduled: check due-soon + overdue tasks ──
    if (!event) {
      const tasks = await base44.asServiceRole.entities.Task.filter({});
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const results = [];

      for (const task of tasks) {
        if (!task.assigned_to || task.status === 'Completed') continue;
        if (!task.due_date) continue;

        const user = await base44.asServiceRole.entities.User.get(task.assigned_to).catch(() => null);
        if (!user) continue;

        const dueDate = new Date(task.due_date + 'T00:00:00');
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const isOverdue = dueDate < new Date(today + 'T00:00:00');

        if (isOverdue) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: user.email,
            subject: `⚠️ Overdue Task: ${task.name}`,
            body: buildOverdueBody(task)
          });
          results.push({ task: task.name, type: 'overdue', user: user.email });
        } else if (daysUntilDue <= 2 && daysUntilDue >= 0) {
          const label = daysUntilDue === 0 ? 'today' : daysUntilDue === 1 ? 'tomorrow' : 'in 2 days';
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: user.email,
            subject: `⏰ Task Due ${label.charAt(0).toUpperCase() + label.slice(1)}: ${task.name}`,
            body: buildDueSoonBody(task, label)
          });
          results.push({ task: task.name, type: 'due_soon', user: user.email });
        }
      }

      return Response.json({ success: true, notified: results });
    }

    // ── Entity automation: task created or updated ──
    const task = data;
    if (!task.assigned_to) {
      return Response.json({ success: true, reason: 'no_assignee' });
    }

    const user = await base44.asServiceRole.entities.User.get(task.assigned_to).catch(() => null);
    if (!user) {
      return Response.json({ success: true, reason: 'user_not_found' });
    }

    if (event.type === 'create') {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: `📋 New Task Assigned: ${task.name}`,
        body: buildAssignedBody(task)
      });
      return Response.json({ success: true, type: 'task_assigned', user: user.email });
    }

    if (event.type === 'update') {
      const statusChanged = old_data && old_data.status !== task.status;
      const dueDateChanged = old_data && old_data.due_date !== task.due_date;
      const assignedChanged = old_data && old_data.assigned_to !== task.assigned_to;

      if (!statusChanged && !dueDateChanged && !assignedChanged) {
        return Response.json({ success: true, reason: 'no_relevant_change' });
      }

      const changes = [];
      if (statusChanged) changes.push(`Status: ${old_data.status} → ${task.status}`);
      if (dueDateChanged) changes.push(`Due Date: ${old_data.due_date || 'Not set'} → ${task.due_date || 'Not set'}`);

      // Notify the current assignee about the update
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: `🔄 Task Updated: ${task.name}`,
        body: buildUpdatedBody(task, changes)
      });

      // If task was reassigned, also notify the new assignee
      if (assignedChanged && task.assigned_to && task.assigned_to !== old_data?.assigned_to) {
        const newUser = await base44.asServiceRole.entities.User.get(task.assigned_to).catch(() => null);
        if (newUser) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: newUser.email,
            subject: `📋 Task Reassigned to You: ${task.name}`,
            body: buildAssignedBody(task)
          });
        }
      }

      return Response.json({ success: true, type: 'task_updated', user: user.email });
    }

    return Response.json({ success: true, reason: 'no_action' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function buildAssignedBody(task) {
  const lines = [
    `A task has been assigned to you in One Eleven Group HQ:`,
    ``,
    `Task: ${task.name}`,
    `Priority: ${task.priority}`,
    `Status: ${task.status}`,
    `Due Date: ${task.due_date || 'Not set'}`,
    ``,
    `Log in to view and manage your tasks.`,
  ];
  return lines.join('\n');
}

function buildUpdatedBody(task, changes) {
  const lines = [
    `Your task has been updated in One Eleven Group HQ:`,
    ``,
    `Task: ${task.name}`,
    ...changes.map(c => `• ${c}`),
    ``,
    `Current Status: ${task.status}`,
    `Priority: ${task.priority}`,
    `Due Date: ${task.due_date || 'Not set'}`,
    ``,
    `Log in to view details.`,
  ];
  return lines.join('\n');
}

function buildDueSoonBody(task, label) {
  const lines = [
    `This task is due ${label}:`,
    ``,
    `Task: ${task.name}`,
    `Due Date: ${task.due_date}`,
    `Priority: ${task.priority}`,
    `Status: ${task.status}`,
    ``,
    `Log in to One Eleven Group HQ to complete or update it.`,
  ];
  return lines.join('\n');
}

function buildOverdueBody(task) {
  const lines = [
    `This task is past its due date and needs attention:`,
    ``,
    `Task: ${task.name}`,
    `Was Due: ${task.due_date}`,
    `Priority: ${task.priority}`,
    `Current Status: ${task.status}`,
    ``,
    `Please update the status or complete it.`,
    `Log in to One Eleven Group HQ.`,
  ];
  return lines.join('\n');
}