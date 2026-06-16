import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Calendar, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CALENDAR_CONNECTOR_ID = '6a31a2611d8d2e3bdb3a55ce';

export default function CalendarStrip() {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkCalendar();
  }, []);

  const checkCalendar = async () => {
    try {
      const res = await base44.functions.invoke('getCalendarEvents', {});
      setConnected(res.data?.connected || false);
      setEvents(res.data?.events || []);
    } catch {
      setConnected(false);
      setEvents([]);
    }
    setLoading(false);
  };

  const handleConnect = async () => {
    const url = await base44.connectors.connectAppUser(CALENDAR_CONNECTOR_ID);
    const popup = window.open(url, '_blank');
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        checkCalendar();
      }
    }, 500);
  };

  const todayEvents = events.filter(e => {
    const date = e.start ? new Date(e.start).toDateString() : null;
    return date === new Date().toDateString();
  });

  if (loading) {
    return (
      <div className="bg-card border rounded-xl p-4 flex items-center gap-3">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading calendar...</span>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="bg-card border rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Connect Google Calendar</p>
            <p className="text-xs text-muted-foreground">See your daily events right here.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleConnect}>
          Connect
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-accent" />
          <h4 className="font-heading font-bold text-sm">Today</h4>
        </div>
      </div>
      {todayEvents.length === 0 ? (
        <p className="text-xs text-muted-foreground">No events scheduled today.</p>
      ) : (
        <div className="space-y-2">
          {todayEvents.slice(0, 3).map(evt => (
            <div key={evt.id} className="flex items-center gap-2 text-sm">
              <div className="w-1 h-1 rounded-full bg-accent shrink-0" />
              <span className="truncate">{evt.summary}</span>
              {evt.start && !evt.allDay && (
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(evt.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 pt-3 border-t">
        <p className="text-xs text-muted-foreground">
          {events.length > 0
            ? `${events.length} events this week`
            : 'No events this week'}
        </p>
      </div>
    </div>
  );
}