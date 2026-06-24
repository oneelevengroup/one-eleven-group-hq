import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const APP_URL = 'https://one-eleven-group-hq.base44.app';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    if (!body.event || body.event.type !== 'update' || body.event.entity_name !== 'ContentSession') {
      return Response.json({ success: true, reason: 'not_content_session_update' });
    }

    const { data, old_data, changed_fields } = body;

    if (!data) {
      return Response.json({ success: true, reason: 'no_data' });
    }

    // Only fire when upload_status just changed to "Uploaded" and we haven't emailed yet
    const statusChangedToUploaded =
      data.upload_status === 'Uploaded' &&
      changed_fields &&
      changed_fields.includes('upload_status');

    if (!statusChangedToUploaded) {
      return Response.json({ success: true, reason: 'status_not_changed_to_uploaded' });
    }

    if (data.upload_email_sent) {
      return Response.json({ success: true, reason: 'email_already_sent' });
    }

    // Fetch Karlee Evans from the team roster
    const users = await base44.asServiceRole.entities.User.list();
    const karlee = users.find(u => {
      const dn = (u.display_name || '').toLowerCase().trim();
      const fn = (u.full_name || '').toLowerCase().trim();
      return dn === 'karlee evans' || fn === 'karlee evans' || dn.includes('karlee') || fn.includes('karlee');
    });

    if (!karlee || !karlee.email) {
      return Response.json({ success: false, error: 'Karlee Evans not found in team roster' });
    }

    // Resolve client name
    let clientName = data.client_name;
    if (!clientName && data.client_id) {
      const client = await base44.asServiceRole.entities.Client.get(data.client_id).catch(() => null);
      if (client) clientName = client.name;
    }
    clientName = clientName || 'Unknown Client';

    const sessionDate = data.session_date
      ? new Date(data.session_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : '(no date set)';

    const subject = `Content Uploaded to Dropbox — ${clientName}`;
    const body_html = `<div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #f8fafc;">
  <div style="background: #0F1226; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #A5F8D3; margin: 0; font-size: 20px; font-weight: 800;">ONE ELEVEN GROUP HQ</h1>
    <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 13px;">Content Upload Notification</p>
  </div>
  <div style="background: #ffffff; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
    <p style="color: #0F1226; font-size: 15px; margin: 0 0 16px;">Hi Karlee,</p>
    <p style="color: #334155; font-size: 14px; margin: 0 0 16px; line-height: 1.5;">
      New content for <strong>${escapeHtml(clientName)}</strong> (session <strong>${escapeHtml(sessionDate)}</strong>) has been uploaded to Dropbox.
    </p>
    ${data.notes ? `<div style="background: #f1f5f9; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px;"><p style="color: #64748b; font-size: 13px; margin: 0;"><strong>Notes:</strong> ${escapeHtml(data.notes)}</p></div>` : ''}
    <a href="${APP_URL}/content-upload" style="display: inline-block; background: #0F1226; color: #A5F8D3; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">View Content Sessions</a>
  </div>
  <p style="color: #94a3b8; font-size: 12px; margin: 16px 0 0; text-align: center;">You're receiving this because a content session was marked as Uploaded.</p>
</div>`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: karlee.email,
      subject,
      body: body_html,
      from_name: 'One Eleven Group HQ',
    });

    // Mark as sent so we never re-send
    await base44.asServiceRole.entities.ContentSession.update(data.id, { upload_email_sent: true });

    return Response.json({ success: true, emailed: karlee.email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}