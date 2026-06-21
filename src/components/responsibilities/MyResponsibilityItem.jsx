import React from 'react';
import { Check } from 'lucide-react';

export default function MyResponsibilityItem({ responsibility, onToggle }) {
  const done = responsibility.doneThisWeek;
  return (
    <label className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${done ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' : 'bg-background/70 border-border hover:border-accent/50'}`}>
      <span className={`flex items-center justify-center w-5 h-5 rounded border shrink-0 transition-colors ${done ? 'bg-green-500 border-green-500 text-white' : 'border-border bg-muted'}`}>
        {done && <Check className="w-3.5 h-3.5" />}
      </span>
      <span className={`text-sm font-medium ${done ? 'text-foreground line-through opacity-60' : 'text-foreground'}`}>{responsibility.description}</span>
      <span className={`ml-auto text-xs font-semibold shrink-0 ${done ? 'text-green-500' : 'text-amber-500'}`}>{done ? 'Complete' : 'To do'}</span>
      <input type="checkbox" checked={done} onChange={() => onToggle(responsibility)} className="sr-only" />
    </label>
  );
}