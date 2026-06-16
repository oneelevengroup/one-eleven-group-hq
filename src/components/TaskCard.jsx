import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Calendar, User, Clock, MoreHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

const PRIORITY_COLORS = { Low: 'bg-slate-500', Medium: 'bg-blue-500', High: 'bg-orange-500', Urgent: 'bg-red-500' };
const STATUS_COLORS = { 'To Do': 'bg-slate-500', 'In Progress': 'bg-blue-500', 'In Review': 'bg-amber-500', 'Done': 'bg-green-500' };

export default function TaskCard({ task, clients, teamMembers, compact, onEdit, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const client = clients?.find(c => c.id === task.client_id);
  const assignee = teamMembers?.find(m => m.id === task.assigned_to);
  const assigner = teamMembers?.find(m => m.id === task.assigned_by);
  const isOverdue = task.due_date && task.due_date < new Date().toISOString().slice(0, 10) && task.status !== 'Done';

  const handleStatusChange = async (newStatus) => {
    await base44.entities.Task.update(task.id, { status: newStatus });
    onRefresh?.();
  };

  return (
    <Card className={`group hover:shadow-md transition-shadow ${isOverdue ? 'border-red-500/50' : ''}`}>
      <CardContent className={`${compact ? 'p-3' : 'p-4'}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className={`font-heading font-bold ${compact ? 'text-sm' : 'text-base'} truncate`}>{task.name}</h4>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {client && (
                <Badge variant="outline" className="text-xs" style={{ borderColor: client.color_tag, color: client.color_tag }}>
                  {client.name}
                </Badge>
              )}
              <Badge className={`text-xs text-white ${PRIORITY_COLORS[task.priority] || 'bg-slate-500'}`}>
                {task.priority}
              </Badge>
            </div>
          </div>
          <Select value={task.status} onValueChange={handleStatusChange}>
            <SelectTrigger className={`h-7 text-xs w-[110px] ${STATUS_COLORS[task.status]} text-white border-0`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="To Do">To Do</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="In Review">In Review</SelectItem>
              <SelectItem value="Done">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          {task.due_date && (
            <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-semibold' : ''}`}>
              <Calendar className="w-3 h-3" /> {task.due_date} {isOverdue && '(Overdue)'}
            </span>
          )}
          {assignee && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" /> {assignee.full_name || assignee.email}
            </span>
          )}
        </div>

        {!compact && task.notes && (
          <button onClick={() => setExpanded(!expanded)} className="mt-3 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Hide notes' : 'Show notes'}
          </button>
        )}

        {!compact && expanded && task.notes && (
          <p className="mt-2 text-sm text-muted-foreground border-t pt-2">{task.notes}</p>
        )}

        {onEdit && (
          <div className="mt-3 pt-3 border-t flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" onClick={onEdit} className="text-xs h-7">Edit</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}