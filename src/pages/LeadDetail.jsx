import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Phone, Mail, Calendar, Plus, Save, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDisplayName } from '@/lib/utils';
import TouchpointForm from '@/components/leads/TouchpointForm';
import LeadForm from '@/components/leads/LeadForm';
import { getTeamMembers } from '@/lib/getTeamMembers';

const STATUS_COLORS = {
  'New': 'bg-purple-500/10 text-purple-400',
  'Proposal Sent': 'bg-amber-500/10 text-amber-400',
  'Contract Sent': 'bg-green-500/10 text-green-400',
  'Cold': 'bg-red-500/10 text-red-400',
};

export default function LeadDetail() {
  const { id } = useParams();
  const [lead, setLead] = useState(null);
  const [touchpoints, setTouchpoints] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTouchpointForm, setShowTouchpointForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState(lead?.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);

  const loadData = async () => {
    try {
      const results = await Promise.allSettled([
        base44.entities.Lead.filter(),
        base44.entities.Touchpoint.filter({lead_id: id}, '-date'),
        getTeamMembers(),
      ]);
      const leadList = results[0].status === 'fulfilled' ? results[0].value : [];
      const tpList = results[1].status === 'fulfilled' ? results[1].value : [];
      const userList = results[2].status === 'fulfilled' ? results[2].value : [];
      const found = leadList.find(l => l.id === id) || null;
      setLead(found);
      setTouchpoints(tpList);
      setUsers(userList);
    } catch (err) {
      console.error('LeadDetail load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  useEffect(() => { if (lead) setNotesDraft(lead.notes || ''); }, [lead?.id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
    </div>
  );

  if (!lead) return (
    <div className="text-center py-16">
      <h2 className="text-xl font-heading font-bold text-foreground">Lead not found</h2>
      <Link to="/leads" className="text-accent mt-2 inline-block text-sm font-medium">Back to Leads</Link>
    </div>
  );

  const owner = users.find(u => u.id === lead.assigned_to);

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link to="/leads" className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-heading font-extrabold text-foreground">{lead.company_name}</h1>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[lead.status]}`}>{lead.status}</span>
          </div>
        </div>
        <Button variant="outline" onClick={() => setShowEditForm(true)} className="border-border">Edit</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-heading font-bold text-sm text-foreground mb-3">Contact</h3>
          <p className="text-foreground font-medium">{lead.contact_name || '—'}</p>
          {lead.contact_email && <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1"><Mail className="w-3.5 h-3.5" /> {lead.contact_email}</p>}
          {lead.contact_phone && <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5"><Phone className="w-3.5 h-3.5" /> {lead.contact_phone}</p>}
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-heading font-bold text-sm text-foreground mb-3">Details</h3>
          <p className="text-sm text-muted-foreground"><span className="text-foreground font-medium">Owner:</span> {owner ? getDisplayName(owner) : 'Unassigned'}</p>
          {lead.next_followup_date && <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(lead.next_followup_date).toLocaleDateString()}</p>}
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-bold text-sm text-foreground">Notes</h3>
            {!editingNotes && (
              <button onClick={() => { setNotesDraft(lead.notes || ''); setEditingNotes(true); }} className="text-muted-foreground hover:text-foreground transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {editingNotes ? (
            <div>
              <textarea value={notesDraft} onChange={e => setNotesDraft(e.target.value)} rows={4} className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent/50" placeholder="Add notes about this lead..." />
              <div className="flex gap-2 mt-2">
                <Button size="sm" disabled={savingNotes} onClick={async () => {
                  setSavingNotes(true);
                  await base44.entities.Lead.update(lead.id, { notes: notesDraft });
                  setLead({ ...lead, notes: notesDraft });
                  setSavingNotes(false);
                  setEditingNotes(false);
                }} className="bg-accent text-accent-foreground hover:bg-accent/90 h-8 text-xs"><Save className="w-3 h-3 mr-1" /> Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingNotes(false)} className="h-8 text-xs">Cancel</Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lead.notes || 'No notes yet.'}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-bold text-lg text-foreground">Touchpoints</h2>
        <Button size="sm" onClick={() => setShowTouchpointForm(true)} className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="w-3.5 h-3.5 mr-1.5" /> Log Touchpoint</Button>
      </div>

      {touchpoints.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-muted-foreground">No touchpoints logged yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {touchpoints.map(tp => (
            <div key={tp.id} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${
                  tp.type === 'call' ? 'bg-blue-500/10 text-blue-400' : tp.type === 'email' ? 'bg-green-500/10 text-green-400' : 'bg-purple-500/10 text-purple-400'
                }`}>{tp.type}</span>
                <span className="text-xs text-muted-foreground">{new Date(tp.date).toLocaleDateString()}</span>
              </div>
              {tp.summary && <p className="text-sm text-foreground whitespace-pre-wrap">{tp.summary}</p>}
              {tp.outcome && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{tp.outcome}</p>}
            </div>
          ))}
        </div>
      )}

      {showTouchpointForm && <TouchpointForm leadId={lead.id} onClose={() => setShowTouchpointForm(false)} onSaved={() => { setShowTouchpointForm(false); loadData(); }} />}
      {showEditForm && <LeadForm lead={lead} users={users} onClose={() => setShowEditForm(false)} onSaved={() => { setShowEditForm(false); loadData(); }} />}
    </div>
  );
}