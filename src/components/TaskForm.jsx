import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function TaskForm({ task, clients, teamMembers, currentUser, defaultClientId, onClose, onSaved }) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    name: task?.name || '',
    client_id: task?.client_id || defaultClientId || '',
    assigned_to: task?.assigned_to || '',
    assigned_by: task?.assigned_by || currentUser?.id || '',
    due_date: task?.due_date || '',
    priority: task?.priority || 'Medium',
    status: task?.status || 'To Do',
    notes: task?.notes || '',
    file_attachments: task?.file_attachments || [],
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    if (isEdit) {
      await base44.entities.Task.update(task.id, form);
    } else {
      await base44.entities.Task.create(form);
    }
    setSaving(false);
    onSaved?.();
    onClose?.();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const res = await base44.integrations.Core.UploadFile({ file });
    setForm({ ...form, file_attachments: [...form.file_attachments, res.file_url] });
    setUploading(false);
  };

  const removeAttachment = (url) => {
    setForm({ ...form, file_attachments: form.file_attachments.filter(u => u !== url) });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading font-bold">{isEdit ? 'Edit Task' : 'New Task'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div><Label>Task Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="What needs to be done?" /></div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Client</Label>
              <Select value={form.client_id} onValueChange={v => setForm({ ...form, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>No client</SelectItem>
                  {clients?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Assigned To</Label>
              <Select value={form.assigned_to} onValueChange={v => setForm({ ...form, assigned_to: v })}>
                <SelectTrigger><SelectValue placeholder="Select team member" /></SelectTrigger>
                <SelectContent>
                  {teamMembers?.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name || m.email}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Assigned By</Label>
              <Select value={form.assigned_by} onValueChange={v => setForm({ ...form, assigned_by: v })}>
                <SelectTrigger><SelectValue placeholder="Who assigned this?" /></SelectTrigger>
                <SelectContent>
                  {teamMembers?.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name || m.email}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><Label>Due Date</Label><Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="To Do">To Do</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="In Review">In Review</SelectItem>
                  <SelectItem value="Done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Details, context, links..." rows={3} /></div>

          <div>
            <Label>Attachments</Label>
            <div className="flex items-center gap-2 mt-1">
              <Button type="button" variant="outline" size="sm" asChild>
                <label className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-1" />
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upload File'}
                  <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                </label>
              </Button>
            </div>
            {form.file_attachments?.length > 0 && (
              <div className="mt-2 space-y-1">
                {form.file_attachments.map((url, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-muted rounded px-2 py-1">
                    <a href={url} target="_blank" className="text-accent hover:underline truncate">{url.split('/').pop()}</a>
                    <button onClick={() => removeAttachment(url)} className="text-muted-foreground hover:text-red-500"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.name.trim()} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            {isEdit ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}