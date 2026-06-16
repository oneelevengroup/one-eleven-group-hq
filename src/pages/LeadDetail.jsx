import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Phone, Mail, Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TouchpointForm from '@/components/leads/TouchpointForm';
import LeadForm from '@/components/leads/LeadForm';

const STATUS_COLORS = {
  'New': 'bg-purple-500/10 text-purple-400',
  'Contacted': 'bg-blue-500/10 text-blue-400',
  'Proposal Sent': 'bg-amber-500/10 text-amber-400',
  'Won': 'bg-green-500/10 text-green-400',
  'Lost': 'bg-red-500/10 text-red-400',
};

export default function LeadDetail() {
  const { id } = useParams();
  const [lead, setLead] = useState(null);
  const [touchpoints, setTouchpoints] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTouchpointForm, setShowTouchpointForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  const loadData = async () => {
    const [leadList, tpList, userList] = await Promise.all([
      base44.entities.Lead.filter(),
      base44.entities.Touchpoint.filter({lead_id: id}, '-date'),
      base44.entities.User.list(),
    ]);
    const found = leadList.find(l => l.id === id) || null;
    setLead(found);
    setTouchpoints(tpList);
    setUsers(userList);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [id]);

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
          <p className="text-sm text-muted-foreground"><span className="text-foreground font-medium">Owner:</span> {owner?.full_name || 'Unassigned'}</p>
          {lead.next_followup_date && <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(lead.next_followup_date).toLocaleDateString()}</p>}
        </div>
        {lead.notes && (
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-heading font-bold text-sm text-foreground mb-3">Notes</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lead.notes}</p>
          </div>
        )}
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