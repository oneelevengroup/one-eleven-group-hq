import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export default function TaskForm({ clients, users, currentUser, preselectedClient, task, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: task?.name || '',
    client_id: task?.client_id || preselectedClient || '',
    assigned_to: task?.assigned_to || '',
    assigned_by: task?.assigned_by || currentUser?.id || '',
    due_date: task?.due_date || '',
    priority: task?.priority || 'Medium',
    status: task?.status || 'To Do',
    notes: task?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    if (task) {
      await base44.entities.Task.update(task.id, form);
    } else {
      await base44.entities.Task.create(form);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-border shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-heading font-bold text-lg text-foreground">{task ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Task Name</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50" placeholder="What needs to be done?" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Client</label>
              <select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50">
                <option value="">Select client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Status</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50">
                {['To Do', 'In Progress', 'In Review', 'Done'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Assigned To</label>
              <select value={form.assigned_to} onChange={e => setForm({...form, assigned_to: e.target.value})} className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50">
                <option value="">Select team member</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Assigned By</label>
              <select value={form.assigned_by} onChange={e => setForm({...form, assigned_by: e.target.value})} className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50">
                <option value="">Select</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Due Date</label>
              <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Priority</label>
              <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50">
                {['Low', 'Medium', 'High', 'Urgent'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent/50" placeholder="Any additional details..." />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-border">Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">{saving ? 'Saving...' : task ? 'Update' : 'Create Task'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}