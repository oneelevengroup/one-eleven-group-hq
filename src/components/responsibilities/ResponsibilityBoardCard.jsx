import React from 'react';
import { Check, Pencil, Trash2 } from 'lucide-react';

export default function ResponsibilityBoardCard({ responsibility, client, doneThisWeek, canToggle, canEdit, onToggle, onEdit, onDelete }) {
  return (
    <div className={`group relative rounded-lg border p-3 transition-colors ${doneThisWeek ? 'bg-green-500/10 border-green-500/30' : 'bg-card border-border'}`}>
      {canEdit && (
        <div className="absolute top-1.5 right-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(responsibility)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="Edit">
            <Pencil className="w-3 h-3" />
          </button>
          <button onClick={() => onDelete(responsibility)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-red-500" title="Delete">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
      <div className="flex items-start gap-2.5">
        <button
          onClick={() => canToggle && onToggle(responsibility)}
          disabled={!canToggle}
          title={canToggle ? (doneThisWeek ? 'Mark as To Do' : 'Mark complete') : 'You can only complete your own cards'}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
            doneThisWeek
              ? 'bg-green-500 border-green-500 text-white'
              : canToggle
                ? 'border-muted-foreground/40 hover:border-accent cursor-pointer'
                : 'border-muted-foreground/20 cursor-not-allowed'
          }`}
        >
          {doneThisWeek && <Check className="w-3 h-3" strokeWidth={3} />}
        </button>
        <div className="min-w-0 pr-8">
          <p className={`text-sm font-medium leading-snug ${doneThisWeek ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
            {responsibility.description}
          </p>
          {client && (
            <div className="flex items-center gap-1.5 mt-1">
              {client.color_tag && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: client.color_tag }} />}
              <span className="text-xs text-muted-foreground truncate">{client.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}