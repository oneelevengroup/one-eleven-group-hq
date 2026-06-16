import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const TYPES = ['call', 'email', 'meeting'];

export default function TouchpointForm({ leadId, onClose, onSaved }) {
  const [form, setForm] = useState({
    lead_id: leadId,
    type: 'call',
    date: new Date().toISOString().split('T')[0],
    summary: '',
    outcome: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.entities.Touchpoint.create(form);
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-md border border-border shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-heading font-bold text-lg text-foreground">Log Touchpoint</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Type</label>
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground capitalize focus:outline-none focus:ring-2 focus:ring-accent/50">
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Date</label>
            <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Summary</label>
            <textarea value={form.summary} onChange={e => setForm({...form, summary: e.target.value})} rows={2} className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent/50" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Outcome</label>
            <input value={form.outcome} onChange={e => setForm({...form, outcome: e.target.value})} className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-border">Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">{saving ? 'Saving...' : 'Log Touchpoint'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}