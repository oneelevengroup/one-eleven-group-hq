import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CalendarDays, CheckCircle2, AlertCircle, Clock, ListTodo, CalendarPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getTeamMembers } from '@/lib/getTeamMembers';

const STATUS_DOT = {
  'URGENT': 'bg-red-400',
  'To Do': 'bg-slate-400',
  'In Progress': 'bg-accent',
  'Stuck': 'bg-amber-400',
  'Completed': 'bg-green-400',
};

export default function TodayAtAGlance({ tasks, user }) {
  const [embedSrc, setEmbedSrc] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

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

  useEffect(() => {
    const loadEmbed = async () => {
      try {
        const userList = await getTeamMembers();
        const me = userList.find(u => u.id === user?.id);
        setEmbedSrc(me?.calendar_embed_src || null);
      } catch {
        setEmbedSrc(null);
      }
      setLoadingUser(false);
    };
    loadEmbed();
  }, [user?.id]);

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

      <div className="border-t pt-4 mb-4">
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

      <div className="border-t pt-4">
        <div className="flex items-center gap-2 mb-2">
          <CalendarDays className="w-4 h-4 text-accent" />
          <h4 className="font-heading font-bold text-sm text-foreground">My Calendar</h4>
        </div>
        {loadingUser ? (
          <div className="flex items-center justify-center h-[400px] text-sm text-muted-foreground">
            Loading calendar...
          </div>
        ) : embedSrc ? (
          <div className="rounded-lg overflow-hidden border border-border" style={{ height: 400 }}>
            <iframe
              src={embedSrc}
              style={{ border: 0, width: '100%', height: '100%' }}
              frameBorder="0"
              scrolling="no"
              title="My Google Calendar"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center gap-3 rounded-lg border border-dashed border-border bg-muted/30" style={{ height: 400 }}>
            <CalendarPlus className="w-8 h-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">No calendar connected</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">Add your Google Calendar embed URL in Settings to see your personal schedule here.</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/settings">Add Calendar in Settings</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}