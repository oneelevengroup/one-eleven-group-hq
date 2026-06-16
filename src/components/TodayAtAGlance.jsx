import React from 'react';
import { CalendarDays, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export default function TodayAtAGlance({ tasks, user }) {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const myTasks = tasks.filter(t => t.assigned_to === user?.id);
  const urgent = myTasks.filter(t => t.status === 'URGENT').length;
  const inProgress = myTasks.filter(t => t.status === 'In Progress').length;
  const dueToday = myTasks.filter(t => {
    if (!t.due_date) return false;
    return t.due_date === today.toISOString().split('T')[0];
  }).length;

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
        <CalendarDays className="w-5 h-5" /> Today At A Glance
      </h3>
      <p className="text-sm text-muted-foreground mb-4">{dateStr}</p>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-red-100 dark:bg-red-500/10 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <AlertCircle className="w-3.5 h-3.5 text-red-500" />
          </div>
          <p className="text-xl font-bold text-foreground">{urgent}</p>
          <p className="text-[10px] text-muted-foreground">Urgent</p>
        </div>
        <div className="bg-accent/10 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock className="w-3.5 h-3.5 text-accent" />
          </div>
          <p className="text-xl font-bold text-foreground">{inProgress}</p>
          <p className="text-[10px] text-muted-foreground">In Progress</p>
        </div>
        <div className="bg-green-100 dark:bg-green-500/10 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          </div>
          <p className="text-xl font-bold text-foreground">{dueToday}</p>
          <p className="text-[10px] text-muted-foreground">Due Today</p>
        </div>
      </div>
    </div>
  );
}