import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const TAG_COLORS = ['#A5F8D3', '#60A5FA', '#F472B6', '#FBBF24', '#A78BFA', '#FB923C', '#34D399', '#F87171'];

export default function ClientForm({ client, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: client?.name || '',
    contact_info: client?.contact_info || '',
    notes: client?.notes || '',
    color_tag: client?.color_tag || TAG_COLORS[0],
  });
  const [saving, setSaving] = useState(false);

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
      <div className="bg-card rounded-2xl w-full max-w-md border border-border shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-heading font-bold text-lg text-foreground">{client ? 'Edit Client' : 'Add Client'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Client Name</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50" placeholder="Company or client name" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Contact Info</label>
            <input value={form.contact_info} onChange={e => setForm({...form, contact_info: e.target.value})} className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50" placeholder="Email, phone, or key contact" />
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
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent/50" />
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