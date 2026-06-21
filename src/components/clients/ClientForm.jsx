import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { getDisplayName } from '@/lib/utils';
import { X } from 'lucide-react';

const TAG_COLORS = ['#A5F8D3', '#60A5FA', '#F472B6', '#FBBF24', '#A78BFA', '#FB923C', '#34D399', '#F87171'];

const SCOPE_OPTIONS = [
  'Website Design + Development',
  'Social Media Management',
  'SEO/AEO',
  'Content Creation',
  'Digital Ads',
  'Brand Design + Development',
  'A-La-Carte Project',
];

export default function ClientForm({ client, users, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: client?.name || '',
    contact_info: client?.contact_info || '',
    point_of_contact: client?.point_of_contact || '',
    support_staff: client?.support_staff || [],
    scope_of_work: client?.scope_of_work || [],
    notes: client?.notes || '',
    color_tag: client?.color_tag || TAG_COLORS[0],
  });
  const [saving, setSaving] = useState(false);

  const toggleStaff = (userId) => {
    setForm(prev => ({
      ...prev,
      support_staff: prev.support_staff.includes(userId)
        ? prev.support_staff.filter(id => id !== userId)
        : [...prev.support_staff, userId],
    }));
  };

  const toggleScope = (scope) => {
    setForm(prev => ({
      ...prev,
      scope_of_work: prev.scope_of_work.includes(scope)
        ? prev.scope_of_work.filter(s => s !== scope)
        : [...prev.scope_of_work, scope],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    if (client) {
      await base44.entities.Client.update(client.id, form);
    } else {
      await base44.entities.Client.create(form);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-lg border border-border shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card rounded-t-2xl">
          <h2 className="font-heading font-bold text-lg text-foreground">{client ? 'Edit Client' : 'Add Client'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Client Name</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50" placeholder="Company or client name" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Contact Info</label>
              <input value={form.contact_info} onChange={e => setForm({...form, contact_info: e.target.value})} className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50" placeholder="Email or phone" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Point of Contact</label>
              <input value={form.point_of_contact} onChange={e => setForm({...form, point_of_contact: e.target.value})} className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50" placeholder="Client contact name" />
            </div>
          </div>

          {users && users.length > 0 && (
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Support Staff</label>
              <div className="flex flex-wrap gap-2">
                {users.map(u => {
                  const selected = form.support_staff.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleStaff(u.id)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                        selected
                          ? 'bg-accent text-accent-foreground border-accent'
                          : 'bg-muted text-muted-foreground border-border hover:text-foreground'
                      }`}
                    >
                      {getDisplayName(u)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Scope of Work</label>
            <div className="flex flex-wrap gap-1.5">
              {SCOPE_OPTIONS.map(scope => {
                const selected = form.scope_of_work.includes(scope);
                return (
                  <button
                    key={scope}
                    type="button"
                    onClick={() => toggleScope(scope)}
                    className={`text-[11px] font-medium px-2.5 py-1.5 rounded-lg border transition-all ${
                      selected
                        ? 'bg-accent text-accent-foreground border-accent'
                        : 'bg-muted text-muted-foreground border-border hover:text-foreground'
                    }`}
                  >
                    {scope}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Color Tag</label>
            <div className="flex gap-2">
              {TAG_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm({...form, color_tag: c})} className={`w-7 h-7 rounded-full transition-all ${form.color_tag === c ? 'ring-2 ring-foreground scale-110' : 'hover:scale-105'}`} style={{backgroundColor: c}} />
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent/50" placeholder="Additional context..." />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-border">Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">{saving ? 'Saving...' : client ? 'Update' : 'Add Client'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}