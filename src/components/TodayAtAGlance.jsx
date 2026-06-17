import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CalendarDays, CheckCircle2, AlertCircle, Clock, Loader2, ListTodo } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STATUS_DOT = {
  'URGENT': 'bg-red-400',
  'To Do': 'bg-slate-400',
  'In Progress': 'bg-accent',
  'Stuck': 'bg-amber-400',
  'Completed': 'bg-green-400',
};

const CALENDAR_CONNECTOR_ID = '6a32c760705912ec06ba2cc2';

export default function TodayAtAGlance({ tasks, user }) {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const [calLoading, setCalLoading] = useState(true);

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const todayStr = today.toISOString().split('T')[0];

  const myTasks = tasks.filter(t => t.assigned_to === user?.id);
  const activeTasks = myTasks.filter(t => t.status !== 'Completed');
  const allActiveTasks = tasks.filter(t => t.status !== 'Completed');
  const sortTasks = (list) => list.slice().sort((a, b) => {
    const aTop = a.status === 'URGENT' || a.priority === 'Urgent' || a.due_date === todayStr;
    const bTop = b.status === 'URGENT' || b.priority === 'Urgent' || b.due_date === todayStr;
    return (bTop ? 1 : 0) - (aTop ? 1 : 0);
  });
  const displayTasks = sortTasks(activeTasks.length > 0 ? activeTasks : allActiveTasks);
  const urgent = myTasks.filter(t => t.status === 'URGENT' || t.priority === 'Urgent').length;
  const inProgress = myTasks.filter(t => t.status === 'In Progress').length;
  const dueToday = myTasks.filter(t => t.due_date === todayStr).length;

  useEffect(() => { checkCalendar(); }, []);

  const checkCalendar = async () => {
    setCalLoading(true);
    try {
      const res = await base44.functions.invoke('getCalendarEvents', {});
      setConnected(res.data?.connected || false);
      setEvents(res.data?.events_today || []);
    } catch {
      setConnected(false);
      setEvents([]);
    }
    setCalLoading(false);
  };

  const handleConnect = async () => {
    const url = await base44.connectors.connectAppUser(CALENDAR_CONNECTOR_ID);
    const popup = window.open(url, '_blank');
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        // Wait 2s for the connection to be saved before checking
        setTimeout(() => checkCalendar(), 2000);
      }
    }, 500);
  };

  const todayEvents = events.filter(e => {
    const d = e.start ? new Date(e.start).toDateString() : null;
    return d === today.toDateString();
  });

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-heading font-bold text-foreground">Today At A Glance</h3>
          <p className="text-sm text-muted-foreground">{dateStr}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className={`w-4 h-4 ${urgent > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
            <span className="text-foreground font-semibold">{urgent}</span>
            <span className="text-muted-foreground">Urgent</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-accent" />
            <span className="text-foreground font-semibold">{inProgress}</span>
            <span className="text-muted-foreground">In Progress</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className={`w-4 h-4 ${dueToday > 0 ? 'text-green-500' : 'text-muted-foreground'}`} />
            <span className="text-foreground font-semibold">{dueToday}</span>
            <span className="text-muted-foreground">Due Today</span>
          </div>
        </div>
      </div>

      <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* My Tasks */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ListTodo className="w-4 h-4 text-accent" />
            <h4 className="font-heading font-bold text-sm text-foreground">My Tasks</h4>
          </div>
          {displayTasks.length === 0 ? (
            <p className="text-xs text-muted-foreground py-1">No active tasks.</p>
          ) : (
            <div className="space-y-1.5">
              {activeTasks.length === 0 && <p className="text-xs text-muted-foreground mb-1">Showing all team tasks</p>}
              {displayTasks.slice(0, 6).map(task => (
                <div key={task.id} className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${task.status === 'URGENT' || task.priority === 'Urgent' ? 'bg-red-100 dark:bg-red-900/40' : task.due_date === todayStr ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-muted/50'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[task.status] || 'bg-slate-400'}`} />
                  <span className="truncate text-foreground font-medium">{task.name}</span>
                  <span className="shrink-0 text-muted-foreground ml-auto">{task.status}</span>
                </div>
              ))}
              {displayTasks.length > 6 && (
                <p className="text-xs text-muted-foreground pl-1">+{displayTasks.length - 6} more tasks</p>
              )}
            </div>
          )}
        </div>

        {/* Today's Schedule */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="w-4 h-4 text-accent" />
            <h4 className="font-heading font-bold text-sm text-foreground">Today's Schedule</h4>
          </div>
          {calLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading calendar...
            </div>
          ) : !connected ? (
            <div className="flex items-center justify-between py-1">
              <p className="text-xs text-muted-foreground">Connect Google Calendar to see your events</p>
              <Button variant="outline" size="sm" onClick={handleConnect} className="text-xs h-7">Connect</Button>
            </div>
          ) : todayEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground py-1">No events scheduled today.</p>
          ) : (
            <div className="space-y-1">
              {todayEvents.slice(0, 6).map(evt => (
                <div key={evt.id} className="flex items-center gap-2 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                  <span className="truncate text-foreground">{evt.summary}</span>
                  {evt.start && !evt.allDay && (
                    <span className="text-muted-foreground shrink-0 ml-auto">
                      {new Date(evt.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}