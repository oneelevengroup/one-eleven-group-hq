import React from 'react';
import { CheckCircle2, Trash2, Pause, Play, Pencil } from 'lucide-react';

export default function ResponsibilityCard({ responsibility, client, assignee, onComplete, onDelete, onToggleActive, onEdit }) {
  const doneThisWeek = responsibility.doneThisWeek;
  return (
    <div className={`rounded-lg p-3 border transition-all group ${!responsibility.active ? 'bg-muted/30 border-border opacity-60' : doneThisWeek ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' : 'bg-background/70 border-border hover:border-accent/50'}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <h4 className="font-heading font-bold text-sm text-foreground leading-snug">{responsibility.description}</h4>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {client && (
              <span className="text-[10px] font-medium inline-flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full">
                {client.color_tag && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: client.color_tag }} />}
                {client.name}
              </span>
            )}
            {assignee && <span className="text-[10px] text-muted-foreground">{assignee.full_name}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {responsibility.active && !doneThisWeek && (
            <button onClick={() => onComplete(responsibility)} className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md bg-foreground/10 text-foreground hover:bg-foreground hover:text-background transition-colors" title="Mark complete this week">
              <CheckCircle2 className="w-4 h-4" /> Done
            </button>
          )}
          {onEdit && (
            <button onClick={() => onEdit(responsibility)} className="text-muted-foreground/40 hover:text-foreground transition-colors opacity-0 group-hover:opacity-100" title="Edit">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={() => onToggleActive(responsibility)} className="text-muted-foreground/40 hover:text-foreground transition-colors opacity-0 group-hover:opacity-100" title={responsibility.active ? 'Pause' : 'Resume'}>
            {responsibility.active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => onDelete(responsibility)} className="text-muted-foreground/40 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100" title="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {doneThisWeek ? (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500/10 text-green-500">Done this week</span>
        ) : responsibility.active ? (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500">Pending</span>
        ) : (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Paused</span>
        )}
        {responsibility.completed_week && (
          <span className="text-[10px] text-muted-foreground">Last done {responsibility.completed_week}</span>
        )}
      </div>
    </div>
  );
}