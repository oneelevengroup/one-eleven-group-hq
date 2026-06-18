import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Bell, Calendar } from 'lucide-react';

const CONNECTOR_ID = '6a32c760705912ec06ba2cc2';

export default function Settings() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    theme_preference: 'dark',
    notification_preference: 'email',
    phone_number: '',
    timezone: 'America/New_York',
  });
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
    checkCalendar();
  }, []);

  const loadPreferences = async () => {
    try {
      const me = await base44.auth.me();
      if (me) {
        setPreferences({
          theme_preference: me.theme_preference || 'dark',
          notification_preference: me.notification_preference || 'email',
          phone_number: me.phone_number || '',
          timezone: me.timezone || 'America/New_York',
        });
      }
    } catch {}
  };

  const checkCalendar = async () => {
    try {
      const res = await base44.functions.invoke('getCalendarEvents', {});
      setCalendarConnected(res.data?.connected === true);
    } catch {
      setCalendarConnected(false);
    }
    setCalendarLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe(preferences);
    setSaving(false);
  };

  const handleConnectCalendar = async () => {
    const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
    const popup = window.open(url, '_blank');
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        checkCalendar();
      }
    }, 500);
  };

  const handleDisconnectCalendar = async () => {
    await base44.connectors.disconnectAppUser(CONNECTOR_ID);
    setCalendarConnected(false);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-extrabold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your preferences and integrations</p>
      </div>

      <div className="max-w-2xl space-y-6">
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
          {calendarLoading ? (
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">Checking connection...</span>
            </div>
          ) : calendarConnected ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-green-400 font-medium">✓ Connected</p>
              <Button variant="outline" size="sm" onClick={handleDisconnectCalendar} className="border-border text-sm">Disconnect</Button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground mb-3">Connect your Google Calendar to see today's events and get suggested free blocks for task work.</p>
              <Button onClick={handleConnectCalendar} className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">Connect Calendar</Button>
            </div>
          )}
        </div>

        <Button onClick={handleSave} disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
}