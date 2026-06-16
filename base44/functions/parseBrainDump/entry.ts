import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { text } = await req.json();
    if (!text || !text.trim()) {
      return Response.json({ error: 'No text provided' }, { status: 400 });
    }

    // Get existing clients for matching
    const clients = await base44.entities.Client.list();
    const clientNames = clients.map(c => c.name);

    // Parse tasks using LLM
    const parsed = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a task parser for a marketing agency workspace. Parse the following brain dump into actionable tasks.

Available clients: ${JSON.stringify(clientNames)}

For each task, extract:
- name: a clear, concise task name
- client_id: if the task mentions a specific client, match it to one from the available clients list (exact name match). Leave as null if no client is mentioned.
- priority: "Low", "Medium", "High", or "Urgent" based on urgency cues in the text
- due_date: if a date or timeframe is mentioned, return as YYYY-MM-DD (use 2026 as current year if no year specified). Use null if not mentioned.
- notes: any additional details or context

Rules:
- Break multi-step items into separate tasks
- If someone says "call X" or "email X", that's a task
- Be specific and actionable
- Default priority is "Medium" unless urgency is clear

Brain dump:
"${text}"`,
      response_json_schema: {
        type: 'object',
        properties: {
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                client_id: { type: 'string' },
                priority: { type: 'string' },
                due_date: { type: 'string' },
                notes: { type: 'string' },
              },
              required: ['name', 'priority'],
            },
          },
        },
      },
    });

    const tasks = parsed.tasks || [];

    // Map client names to IDs
    const clientMap = {};
    for (const c of clients) {
      clientMap[c.name.toLowerCase()] = c.id;
    }

    const created = [];
    for (const task of tasks) {
      let clientId = null;
      if (task.client_id) {
        clientId = clientMap[task.client_id.toLowerCase()] || null;
      } else if (task.name) {
        // Try matching client names in task name
        for (const c of clients) {
          if (task.name.toLowerCase().includes(c.name.toLowerCase())) {
            clientId = c.id;
            break;
          }
        }
      }

      const newTask = await base44.entities.Task.create({
        name: task.name,
        client_id: clientId,
        assigned_to: user.id,
        assigned_by: user.id,
        priority: task.priority || 'Medium',
        status: 'To Do',
        due_date: task.due_date || null,
        notes: task.notes || '',
      });
      created.push(newTask);
    }

    return Response.json({ success: true, count: created.length, tasks: created.map(t => ({ id: t.id, name: t.name, priority: t.priority })) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});