import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Bell, Calendar } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    display_name: '',
    theme_preference: 'dark',
    notification_preference: 'email',
    phone_number: '',
    timezone: 'America/New_York',
  });
  const [saving, setSaving] = useState(false);
  const [calendarEmbedSrc, setCalendarEmbedSrc] = useState('');

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const me = await base44.auth.me();
      if (me) {
        setPreferences({
          display_name: me.display_name || '',
          theme_preference: me.theme_preference || 'dark',
          notification_preference: me.notification_preference || 'email',
          phone_number: me.phone_number || '',
          timezone: me.timezone || 'America/New_York',
        });
        if (me.id) {
          const userList = await base44.entities.User.filter({ id: me.id });
          const entityUser = userList[0];
          if (entityUser) {
            setCalendarEmbedSrc(entityUser.calendar_embed_src || '');
          }
        }
      }
    } catch {}
  };

  const handleSave = async () => {
    setSaving(true);
    const updateData = { ...preferences, calendar_embed_src: calendarEmbedSrc };
    await base44.auth.updateMe(updateData);
    if (user?.id) {
      await base44.entities.User.update(user.id, updateData);
    }
    setSaving(false);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-extrabold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your preferences and integrations</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-heading font-bold text-foreground mb-4">Profile</h3>
          <label className="text-sm font-medium text-foreground block mb-1.5">Display Name</label>
          <p className="text-xs text-muted-foreground mb-2">Shown across the app instead of your account name when set.</p>
          <input type="text" value={preferences.display_name} onChange={e => setPreferences({...preferences, display_name: e.target.value})} placeholder="e.g. Katie Garwood" className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50" />
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2"><Bell className="w-5 h-5" /> Daily Briefing</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Notification Channel</label>
              <select value={preferences.notification_preference} onChange={e => setPreferences({...preferences, notification_preference: e.target.value})} className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50">
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="both">Email & SMS</option>
                <option value="none">None</option>
              </select>
            </div>
            {['sms', 'both'].includes(preferences.notification_preference) && (
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Phone Number</label>
                <input type="tel" value={preferences.phone_number} onChange={e => setPreferences({...preferences, phone_number: e.target.value})} className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50" placeholder="+1 (555) 000-0000" />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Timezone</label>
              <select value={preferences.timezone} onChange={e => setPreferences({...preferences, timezone: e.target.value})} className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50">
                <option value="America/New_York">Eastern (ET)</option>
                <option value="America/Chicago">Central (CT)</option>
                <option value="America/Denver">Mountain (MT)</option>
                <option value="America/Los_Angeles">Pacific (PT)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2"><Calendar className="w-5 h-5" /> Google Calendar</h3>
          <label className="text-sm font-medium text-foreground block mb-1.5">Calendar Embed URL</label>
          <p className="text-xs text-muted-foreground mb-2">Paste the <code className="bg-muted px-1 rounded">src</code> value from your Google Calendar embed iframe (Google Calendar → Settings → your calendar → Integrate calendar → copy the URL inside <code className="bg-muted px-1 rounded">src="..."</code>). Each user adds their own to see their personal calendar on the dashboard.</p>
          <input
            type="text"
            value={calendarEmbedSrc}
            onChange={e => setCalendarEmbedSrc(e.target.value)}
            placeholder="https://calendar.google.com/calendar/embed?src=..."
            className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>

        <Button onClick={handleSave} disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
}