import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { X, Calendar, User, Send } from 'lucide-react';

const PRIORITY_COLORS = { Low: 'bg-slate-500/10 text-slate-400', Medium: 'bg-blue-500/10 text-blue-400', High: 'bg-orange-500/10 text-orange-400', Urgent: 'bg-red-500/10 text-red-400' };
const STATUS_COLORS = { 'URGENT': 'bg-red-100 text-red-500 dark:bg-red-500/20 dark:text-red-400', 'To Do': 'bg-slate-500/10 text-slate-400', 'In Progress': 'bg-accent/10 text-accent', 'Stuck': 'bg-amber-500/10 text-amber-400', 'Completed': 'bg-green-500/10 text-green-400' };

export default function TaskDetail({ task, clients, users, currentUser, onClose, onUpdated }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    status: task.status, priority: task.priority, notes: task.notes || '',
    assigned_to: task.assigned_to || '', name: task.name,
    client_id: task.client_id || '', due_date: task.due_date || '',
  });

  const client = clients.find(c => c.id === task.client_id);
  const assignee = users.find(u => u.id === task.assigned_to);
  const assigner = users.find(u => u.id === task.assigned_by);

  useEffect(() => { loadComments(); }, [task.id]);

  const loadComments = async () => {
    const list = await base44.entities.Comment.filter({task_id: task.id}, '-created_date');
    setComments(list);
  };

  const handleStatusChange = async (status) => {
    await base44.entities.Task.update(task.id, { status });
    onUpdated();
  };

  const handleSaveEdit = async () => {
    await base44.entities.Task.update(task.id, editForm);
    setEditing(false);
    onUpdated();
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    await base44.entities.Comment.create({ task_id: task.id, author: currentUser?.full_name || 'Team Member', body: newComment });
    setNewComment('');
    loadComments();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-heading font-bold text-lg text-foreground">{task.name}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[task.status]}`}>{task.status}</span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
            {client && (
              <span className="text-xs font-medium flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-full">
                {client.color_tag && <span className="w-2 h-2 rounded-full" style={{backgroundColor: client.color_tag}} />}
                {client.name}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            {assignee && <p className="text-muted-foreground flex items-center gap-1.5"><User className="w-4 h-4" /> <span className="text-foreground font-medium">Assigned to:</span> {assignee.full_name}</p>}
            {assigner && <p className="text-muted-foreground flex items-center gap-1.5"><User className="w-4 h-4" /> <span className="text-foreground font-medium">Assigned by:</span> {assigner.full_name}</p>}
            {task.due_date && <p className="text-muted-foreground flex items-center gap-1.5"><Calendar className="w-4 h-4" /> <span className="text-foreground font-medium">Due:</span> {new Date(task.due_date).toLocaleDateString()}</p>}
          </div>

          {task.notes && !editing && (
            <div className="bg-muted/40 rounded-lg p-3"><p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.notes}</p></div>
          )}

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Quick Status</p>
            <div className="flex gap-2 flex-wrap">
              {['URGENT', 'To Do', 'In Progress', 'Stuck', 'Completed'].map(s => (
                <button key={s} onClick={() => handleStatusChange(s)} className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${task.status === s ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>{s}</button>
              ))}
            </div>
          </div>

          {editing ? (
            <div className="space-y-3 bg-muted/30 rounded-lg p-4">
              <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
              <div className="grid grid-cols-2 gap-3">
                <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                  {['URGENT', 'To Do', 'In Progress', 'Stuck', 'Completed'].map(s => <option key={s}>{s}</option>)}
                </select>
                <select value={editForm.priority} onChange={e => setEditForm({...editForm, priority: e.target.value})} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                  {['Low', 'Medium', 'High', 'Urgent'].map(p => <option key={p}>{p}</option>)}
                </select>
                <select value={editForm.assigned_to} onChange={e => setEditForm({...editForm, assigned_to: e.target.value})} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                  <option value="">Unassigned</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                </select>
                <input type="date" value={editForm.due_date} onChange={e => setEditForm({...editForm, due_date: e.target.value})} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
              </div>
              <textarea value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} rows={2} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground resize-none" />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit} className="bg-accent text-accent-foreground hover:bg-accent/90">Save</Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="border-border">Cancel</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="border-border text-sm">Edit Task</Button>
          )}

          <div className="border-t border-border pt-5">
            <h3 className="font-heading font-bold text-sm text-foreground mb-3">Comments</h3>
            {comments.length === 0 && <p className="text-sm text-muted-foreground mb-4">No comments yet.</p>}
            <div className="space-y-3 mb-4">
              {comments.map(c => (
                <div key={c.id} className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1 font-medium">{c.author} · {new Date(c.created_date).toLocaleString()}</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{c.body}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComment()} className="flex-1 bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50" placeholder="Add a comment..." />
              <Button size="sm" onClick={addComment} className="bg-accent text-accent-foreground hover:bg-accent/90"><Send className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}