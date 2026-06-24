import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const DEAL_TYPES = ['Gifted', 'Paid', 'UGC', 'Affiliate'];
const STATUSES = ['Pitched', 'In talks', 'Confirmed', 'Delivered', 'Paid'];

export default function PRDealForm({ deal, onClose, onSaved }) {
  const [form, setForm] = useState({
    brand_company: deal?.brand_company || '',
    contact: deal?.contact || '',
    deal_type: deal?.deal_type || 'Gifted',
    value: deal?.value || '',
    status: deal?.status || 'Pitched',
    date_pitched: deal?.date_pitched || '',
    date_due: deal?.date_due || '',
    date_posted: deal?.date_posted || '',
    deliverables: deal?.deliverables || '',
    notes: deal?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.brand_company.trim()) return;
    setSaving(true);
    await onSaved(deal?.id || null, {
      ...form,
      value: form.value === '' ? null : Number(form.value),
    });
    setSaving(false);
  };

  const field = (key, label, type = 'text', placeholder = '') => (
    <div>
      <label className="text-sm font-medium text-foreground block mb-1.5">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
        placeholder={placeholder}
      />
    </div>
  );

  const select = (key, label, options) => (
    <div>
      <label className="text-sm font-medium text-foreground block mb-1.5">{label}</label>
      <select
        value={form[key]}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-border shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="font-heading font-bold text-lg text-foreground">{deal ? 'Edit Deal' : 'New PR Deal'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium text-foreground block mb-1.5">Brand / Company</label>
              <input
                value={form.brand_company}
                onChange={e => setForm({ ...form, brand_company: e.target.value })}
                required
                className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                placeholder="e.g. Sephora"
              />
            </div>
            {field('contact', 'Contact')}
            {select('deal_type', 'Deal Type', DEAL_TYPES)}
            {field('value', 'Value ($)', 'number', '0')}
            {select('status', 'Status', STATUSES)}
            {field('date_pitched', 'Date Pitched', 'date')}
            {field('date_due', 'Date Due', 'date')}
            {field('date_posted', 'Date Posted', 'date')}
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Deliverables</label>
            <textarea
              value={form.deliverables}
              onChange={e => setForm({ ...form, deliverables: e.target.value })}
              rows={2}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent/50"
              placeholder="e.g. 1 IG Reel + 2 Stories"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent/50"
              placeholder="Any additional context..."
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-border">Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">{saving ? 'Saving...' : deal ? 'Update' : 'Create Deal'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}