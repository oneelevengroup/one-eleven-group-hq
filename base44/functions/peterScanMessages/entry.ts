import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function matchUser(name, users) {
  if (!name) return null;
  const n = String(name).toLowerCase().trim().replace(/^@/, '');
  if (!n) return null;
  // exact display_name or full_name
  let match = users.find(u =>
    (u.display_name || '').toLowerCase() === n || (u.full_name || '').toLowerCase() === n
  );
  if (match) return match;
  // first-name match
  match = users.find(u => {
    const dn = (u.display_name || '').toLowerCase();
    const fn = (u.full_name || '').toLowerCase();
    return dn.split(' ')[0] === n || fn.split(' ')[0] === n;
  });
  if (match) return match;
  // partial contains (either direction)
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

    const [messages, users, conversations] = await Promise.all([
      base44.asServiceRole.entities.Message.list('-created_date', 50),
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.Conversation.list(),
    ]);

    const unprocessed = messages.filter(m => !m.peter_processed);
    if (unprocessed.length === 0) {
      return Response.json({ created: 0, scanned: 0, message: 'No new messages to scan.' });
    }

    const teamNames = users.map(u => u.display_name || u.full_name).filter(Boolean).join(', ');
    const ctx = unprocessed.map(m => {
      const conv = conversations.find(c => c.id === m.conversation_id);
      const sender = users.find(u => u.id === m.sender_id);
      const senderName = sender?.display_name || sender?.full_name || 'Someone';
      const convName = conv?.name || (conv?.type === 'direct' ? 'Direct Message' : 'Conversation');
      return `[${convName}] ${senderName}: ${m.content || ''}`;
    }).join('\n');

    const prompt = `You are Peter the Task Rabbit, an assistant that scans team chat messages and extracts actionable to-do items.

Below are recent messages from a team workspace. Identify any clear action items, tasks, or to-dos that someone should do. For each, capture a concise task description (imperative, e.g. "Send invoice to Acme") and the name of the person responsible — the person who is @mentioned or explicitly named as the one who should do it. If no specific person is responsible, set responsible_person to an empty string.

Only extract genuine to-dos / action items. Ignore questions, status updates, casual chat, jokes, and statements with no actionable commitment. If there are no to-dos, return an empty array.

Team members (match responsible_person to one of these names when possible): ${teamNames}

Messages:
${ctx}

Return JSON with a "todos" array, each item having "description" (string) and "responsible_person" (string, empty if unclear).`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          todos: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                responsible_person: { type: 'string' },
              },
              required: ['description'],
            },
          },
        },
        required: ['todos'],
      },
    });

    const todos = Array.isArray(result?.todos) ? result.todos : [];
    let created = 0;
    for (const todo of todos) {
      const desc = (todo.description || '').trim();
      if (!desc) continue;
      const assignee = matchUser(todo.responsible_person, users);
      await base44.asServiceRole.entities.Task.create({
        name: desc,
        assigned_to: assignee?.id || '',
        assigned_by: '',
        status: 'To Do',
        priority: 'Medium',
        notes: 'Auto-extracted by Peter the Task Rabbit from team messages.',
      });
      created++;
    }

    // Mark scanned messages as processed so we never re-scan them (duplicate prevention).
    for (const m of unprocessed) {
      await base44.asServiceRole.entities.Message.update(m.id, { peter_processed: true });
    }

    return Response.json({ created, scanned: unprocessed.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});