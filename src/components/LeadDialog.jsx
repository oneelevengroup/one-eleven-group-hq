import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const STATUSES = ['New', 'Contacted', 'Proposal Sent', 'Won', 'Lost'];
const TOUCHPOINT_TYPES = ['call', 'email', 'meeting'];
const TYPE_ICONS = { call: '📞', email: '📧', meeting: '🤝' };

export default function LeadDialog({ open, onOpenChange, editing, form, setForm, teamMembers, onSave, onRefresh }) {
  const [touchpoints, setTouchpoints] = useState([]);
  const [newTp, setNewTp] = useState({ type: 'call', date: new Date().toISOString().slice(0, 10), summary: '', outcome: '' });
  const [addingTp, setAddingTp] = useState(false);
  const [savingTp, setSavingTp] = useState(false);

  useEffect(() => {
    if (editing && open) {
      loadTouchpoints();
    } else {
      setTouchpoints([]);
    }
  }, [editing, open]);

  const loadTouchpoints = async () => {
    const tps = await base44.entities.Touchpoint.filter({ lead_id: editing.id }, '-date', 50);
    setTouchpoints(tps);
  };

  const handleAddTouchpoint = async () => {
    if (!newTp.summary.trim()) return;
    setSavingTp(true);
    await base44.entities.Touchpoint.create({ ...newTp, lead_id: editing.id });
    setNewTp({ type: 'call', date: new Date().toISOString().slice(0, 10), summary: '', outcome: '' });
    setAddingTp(false);
    setSavingTp(false);
    loadTouchpoints();
    onRefresh?.();
  };

  const handleDeleteTouchpoint = async (id) => {
    await base44.entities.Touchpoint.delete(id);
    loadTouchpoints();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? 'Edit Lead' : 'Add Lead'}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>Company Name *</Label><Input value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} placeholder="Company name" /></div>
            <div><Label>Contact Name</Label><Input value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} placeholder="Contact" /></div>
            <div><Label>Contact Email</Label><Input value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} placeholder="Email" /></div>
            <div><Label>Contact Phone</Label><Input value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} placeholder="Phone" /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Assigned To</Label>
              <Select value={form.assigned_to} onValueChange={v => setForm({ ...form, assigned_to: v })}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Unassigned</SelectItem>
                  {teamMembers.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name || m.email}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Next Follow-up</Label><Input type="date" value={form.next_followup_date} onChange={e => setForm({ ...form, next_followup_date: e.target.value })} /></div>
          </div>
          <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notes..." rows={2} /></div>

          {/* Touchpoints */}
          {editing && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Touchpoints ({touchpoints.length})</Label>
                {!addingTp && (
                  <Button variant="outline" size="sm" onClick={() => setAddingTp(true)}>
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </Button>
                )}
              </div>

              {touchpoints.length === 0 && !addingTp && (
                <p className="text-xs text-muted-foreground">No outreach logged yet.</p>
              )}

              {touchpoints.map(tp => (
                <div key={tp.id} className="flex items-start justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-start gap-2">
                    <span className="text-sm mt-0.5">{TYPE_ICONS[tp.type] || '📋'}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{tp.type}</Badge>
                        <span className="text-xs text-muted-foreground">{tp.date}</span>
                      </div>
                      <p className="text-sm mt-1">{tp.summary}</p>
                      {tp.outcome && <p className="text-xs text-muted-foreground mt-0.5">Outcome: {tp.outcome}</p>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-500 shrink-0" onClick={() => handleDeleteTouchpoint(tp.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}

              {addingTp && (
                <div className="bg-muted/30 rounded-lg p-3 space-y-3 mt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Type</Label>
                      <Select value={newTp.type} onValueChange={v => setNewTp({ ...newTp, type: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{TOUCHPOINT_TYPES.map(t => <SelectItem key={t} value={t}>{TYPE_ICONS[t]} {t}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Date</Label>
                      <Input type="date" value={newTp.date} onChange={e => setNewTp({ ...newTp, date: e.target.value })} className="h-8 text-xs" />
                    </div>
                  </div>
                  <div><Label className="text-xs">Summary</Label><Input value={newTp.summary} onChange={e => setNewTp({ ...newTp, summary: e.target.value })} placeholder="What happened?" className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">Outcome</Label><Input value={newTp.outcome} onChange={e => setNewTp({ ...newTp, outcome: e.target.value })} placeholder="Result / next steps" className="h-8 text-xs" /></div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddTouchpoint} disabled={savingTp || !newTp.summary.trim()} className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs h-8">
                      {savingTp ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setAddingTp(false)} className="text-xs h-8">Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave} className="bg-accent text-accent-foreground hover:bg-accent/90">{editing ? 'Save' : 'Create'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}