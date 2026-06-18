import React from 'react';
import { Calendar, User, Trash2, CheckCircle2 } from 'lucide-react';

const PRIORITY_COLORS = {
  Low: 'bg-slate-500/10 text-slate-400',
  Medium: 'bg-blue-500/10 text-blue-400',
  High: 'bg-orange-500/10 text-orange-400',
  Urgent: 'bg-red-500/10 text-red-400',
};

const STATUS_COLORS = {
  'URGENT': 'bg-red-100 text-red-500 dark:bg-red-500/20 dark:text-red-400',
  'To Do': 'bg-slate-500/10 text-slate-400',
  'In Progress': 'bg-accent/10 text-accent',
  'Stuck': 'bg-amber-500/10 text-amber-400',
  'Completed': 'bg-green-500/10 text-green-400',
};

export default function TaskCard({ task, client, assignee, onClick, onDelete, onComplete }) {
  return (
    <div onClick={onClick} className={`rounded-lg p-3 border cursor-pointer transition-all hover:shadow-sm group ${task.status === 'URGENT' || task.priority === 'Urgent' ? 'bg-red-100 dark:bg-red-900/50 border-red-300 dark:border-red-700 hover:border-red-400' : task.due_date === new Date().toISOString().split('T')[0] ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 hover:border-yellow-400' : 'bg-background/70 border-border hover:border-accent/50'}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-heading font-bold text-sm text-foreground leading-snug">{task.name}</h4>
        <div className="flex items-center gap-1 shrink-0">
          {onComplete && task.status !== 'Completed' && (
            <button
              onClick={e => { e.stopPropagation(); onComplete(task); }}
              className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md bg-foreground/10 text-foreground hover:bg-foreground hover:text-background transition-colors"
              title="Mark complete"
            >
              <CheckCircle2 className="w-4 h-4" /> Mark Complete
            </button>
          )}
          {onDelete && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(task); }}
              className="text-muted-foreground/40 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              title="Delete task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {client && (
          <span className="text-[10px] font-medium flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full">
            {client.color_tag && <span className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: client.color_tag}} />}
            {client.name}
          </span>
        )}
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${STATUS_COLORS[task.status]}`}>{task.status}</span>
        {task.due_date && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(task.due_date).toLocaleDateString()}</span>
        )}
        {assignee && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" /> {assignee.full_name}</span>
        )}
      </div>
    </div>
  );
}