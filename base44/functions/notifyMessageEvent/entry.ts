import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const APP_URL = 'https://one-eleven-group-hq.base44.app';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event, data } = body;

    if (!event || event.type !== 'create' || event.entity_name !== 'Message') {
      return Response.json({ success: true, reason: 'not_message_create' });
    }

    const message = data;
    if (!message) {
      return Response.json({ success: true, reason: 'no_data' });
    }

    const { conversation_id, sender_id, content } = message;
    if (!conversation_id || !sender_id || !content) {
      return Response.json({ success: true, reason: 'missing_fields' });
    }

    const conversation = await base44.asServiceRole.entities.Conversation.get(conversation_id).catch(() => null);
    if (!conversation) {
      return Response.json({ success: true, reason: 'conversation_not_found' });
    }

    const teamMembers = await base44.asServiceRole.entities.User.list();
    const sender = teamMembers.find(u => u.id === sender_id);
    const senderName = sender ? (sender.display_name || sender.full_name || sender.email) : 'Someone';

    const snippet = content.length > 120 ? content.slice(0, 117) + '...' : content;

    const recipients = new Map();

    if (conversation.type === 'direct') {
      for (const memberId of (conversation.members || [])) {
        if (memberId !== sender_id) {
          const user = teamMembers.find(u => u.id === memberId);
          if (user) recipients.set(memberId, { type: 'dm', user });
        }
      }
    }

    const mentionedUsers = findMentionedUsers(content, teamMembers);
    for (const member of mentionedUsers) {
      if (member.id === sender_id) continue;
      if (!recipients.has(member.id)) {
        recipients.set(member.id, { type: 'mention', user: member });
      }
    }

    const results = [];
    for (const [userId, { type, user }] of recipients) {
      if (!user || !user.email) continue;

      try {
        await base44.asServiceRole.entities.Notification.create({
          user_id: userId,
          type,
          conversation_id,
          sender_id,
          sender_name: senderName,
          snippet,
          read: false,
        });
      } catch (e) {
        console.error('Notification create failed:', e.message);
      }

      const pref = user.notification_preference || 'email';
      if (pref === 'email' || pref === 'both') {
        const subject = type === 'dm'
          ? `\u{1F4AC} New message from ${senderName}`
          : `\u{1F3F7}\u{FE0F} ${senderName} mentioned you in a message`;

        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: user.email,
            subject,
            body: buildEmailBody(senderName, type, snippet),
            from_name: 'One Eleven Group HQ',
          });
        } catch (emailErr) {
          console.error(`Failed to email ${user.email}:`, emailErr.message);
        }
      }

      results.push({ userId, type, email: user.email });
    }

    return Response.json({ success: true, notified: results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function findMentionedUsers(content, teamMembers) {
  const mentioned = [];
  let working = content;

  const membersWithNames = teamMembers
    .map(m => ({
      member: m,
      names: [m.display_name, m.full_name, m.email]
        .filter(n => n && n.trim().length > 1)
        .sort((a, b) => b.length - a.length)
    }))
    .sort((a, b) => {
      const aLen = a.names[0]?.length || 0;
      const bLen = b.names[0]?.length || 0;
      return bLen - aLen;
    });

  for (const { member, names } of membersWithNames) {
    let matched = false;
    for (const name of names) {
      if (matched) break;
      const mention = '@' + name;
      const lowerMention = mention.toLowerCase();
      const lowerWorking = working.toLowerCase();
      let idx = lowerWorking.indexOf(lowerMention);
      while (idx !== -1) {
        const afterIdx = idx + mention.length;
        const afterChar = working[afterIdx];
        if (!afterChar || /[^a-zA-Z0-9_]/.test(afterChar)) {
          if (!mentioned.find(m => m.id === member.id)) {
            mentioned.push(member);
          }
          matched = true;
          working = working.substring(0, idx) + '~'.repeat(mention.length) + working.substring(afterIdx);
          break;
        }
        idx = lowerWorking.indexOf(lowerMention, idx + 1);
      }
    }
  }

  return mentioned;
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildEmailBody(senderName, type, snippet) {
  const typeLabel = type === 'dm' ? 'sent you a direct message' : 'mentioned you in a message';
  return `<div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #f8fafc;">
  <div style="background: #0F1226; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #A5F8D3; margin: 0; font-size: 20px; font-weight: 800;">ONE ELEVEN GROUP HQ</h1>
    <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 13px;">New Message Notification</p>
  </div>
  <div style="background: #ffffff; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
    <p style="color: #0F1226; font-size: 15px; margin: 0 0 16px;"><strong>${escapeHtml(senderName)}</strong> ${typeLabel}:</p>
    <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
      <p style="color: #334155; font-size: 14px; margin: 0; line-height: 1.5;">${escapeHtml(snippet)}</p>
    </div>
    <a href="${APP_URL}/messages" style="display: inline-block; background: #0F1226; color: #A5F8D3; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">View Message \u2192</a>
  </div>
  <p style="color: #94a3b8; font-size: 12px; margin: 16px 0 0; text-align: center;">You're receiving this because you have email notifications enabled. <a href="${APP_URL}/settings" style="color: #A5F8D3;">Manage preferences</a></p>
</div>`;
}