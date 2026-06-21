import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { getDisplayName } from '@/lib/utils';

export default function ResponsibilityForm({ clients, users, currentUser, existing, isAdmin, onClose, onSaved }) {
  const [form, setForm] = useState(existing ? {
    description: existing.description || '',
    client_id: existing.client_id || '',
    assigned_to: existing.assigned_to || '',
    active: existing.active !== false,
  } : {
    description: '',
    client_id: '',
    assigned_to: currentUser?.email || '',
    active: true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description.trim() || !form.assigned_to) return;
    setSaving(true);
    try {
      const payload = { ...form, assigned_to: isAdmin ? form.assigned_to : (currentUser?.email || '') };
      if (existing) {
        await base44.entities.OngoingResponsibility.update(existing.id, payload);
      } else {
        await base44.entities.OngoingResponsibility.create({
          ...payload,
          created_by: currentUser?.email || '',
          completed_week: '',
        });
      }
      onSaved();
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card rounded-xl border border-border p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <h3 className="font-heading font-bold text-lg text-foreground mb-4">{existing ? 'Edit' : 'New'} Ongoing Responsibility</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Description</label>
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. 3 posts, 5 stories" className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50" required />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Client</label>
            <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50">
              <option value="">No client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Assigned To</label>
            {isAdmin ? (
              <select value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50" required>
                {users.map(u => <option key={u.id} value={u.email}>{getDisplayName(u)}</option>)}
              </select>
            ) : (
              <input value={getDisplayName(currentUser)} disabled className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-muted-foreground cursor-not-allowed" />
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="rounded" />
            Active
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">{saving ? 'Saving...' : existing ? 'Save' : 'Create'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}