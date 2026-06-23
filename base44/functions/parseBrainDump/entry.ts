import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function matchUser(name, users) {
  if (!name) return null;
  const n = String(name).toLowerCase().trim().replace(/^@/, '');
  if (!n) return null;
  let match = users.find(u =>
    (u.display_name || '').toLowerCase() === n || (u.full_name || '').toLowerCase() === n
  );
  if (match) return match;
  match = users.find(u => {
    const dn = (u.display_name || '').toLowerCase();
    const fn = (u.full_name || '').toLowerCase();
    return dn.split(' ')[0] === n || fn.split(' ')[0] === n;
  });
  if (match) return match;
  match = users.find(u => {
    const dn = (u.display_name || '').toLowerCase();
    const fn = (u.full_name || '').toLowerCase();
    return (dn && (dn.includes(n) || n.includes(dn))) || (fn && (fn.includes(n) || n.includes(fn)));
  });
  return match || null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { text, image_url } = await req.json();
    if ((!text || !text.trim()) && !image_url) {
      return Response.json({ error: 'No text or image provided' }, { status: 400 });
    }

    // Get existing clients and team roster for matching
    const [clients, users] = await Promise.all([
      base44.entities.Client.list(),
      base44.asServiceRole.entities.User.list(),
    ]);
    const clientNames = clients.map(c => c.name);
    const teamNames = users.map(u => u.display_name || u.full_name).filter(Boolean).join(', ');

    const hasImage = !!image_url;

    // Parse tasks using LLM
    const parsed = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a task parser for a marketing agency workspace. ${hasImage ? 'The user uploaded a photo of their handwritten to-do list. Read the handwriting from the image and convert it into actionable tasks.' : 'Parse the following brain dump into actionable tasks.'}

Available clients: ${JSON.stringify(clientNames)}

For each task, extract:
- name: a clear, concise task name
- client_id: if the task mentions a specific client, match it to one from the available clients list (exact name match). Leave as null if no client is mentioned.
- responsible_person: the name of the person who is responsible for doing this task — the person who is named or implied as the one who should do it (e.g. "Maddie follow up with Tyson" → responsible_person is "Maddie"). Leave as empty string if no specific person is named.
- priority: "Low", "Medium", "High", or "Urgent" based on urgency cues in the text
- due_date: if a date or timeframe is mentioned, return as YYYY-MM-DD (use 2026 as current year if no year specified). Use null if not mentioned.
- notes: any additional details or context
- status: "Completed" if the item is crossed out, struck through, has a checkmark, or is visibly marked as complete. Otherwise "To Do".

Rules:
- Break multi-step items into separate tasks
- If someone says "call X" or "email X", that's a task
- Be specific and actionable
- Default priority is "Medium" unless urgency is clear
- Match responsible_person to a team member name when possible${hasImage ? '\n- If the image contains a handwritten list, extract every line item as a separate task\n- IMPORTANT: Look carefully for checkmarks (✓, ✔), strikethroughs, crossed-out text, or any visual indication that a task is completed. Mark those as "Completed".' : ''}

Team members (match responsible_person to one of these names when possible): ${teamNames}

${hasImage ? 'The photo is attached below.' : `Brain dump:\n"${text}"`}`,
      file_urls: hasImage ? [image_url] : undefined,
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
                responsible_person: { type: 'string' },
                priority: { type: 'string' },
                due_date: { type: 'string' },
                notes: { type: 'string' },
                status: { type: 'string' },
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

      const assignee = matchUser(task.responsible_person, users);
      const newTask = await base44.entities.Task.create({
        name: task.name,
        client_id: clientId,
        assigned_to: assignee?.id || user.id,
        assigned_by: user.id,
        priority: task.priority || 'Medium',
        status: task.status || 'To Do',
        due_date: task.due_date || null,
        notes: task.notes || '',
      });
      created.push(newTask);
    }

    return Response.json({ success: true, count: created.length, tasks: created.map(t => ({ id: t.id, name: t.name, priority: t.priority, status: t.status })) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});