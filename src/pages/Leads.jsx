import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LeadCard from '@/components/leads/LeadCard';
import LeadForm from '@/components/leads/LeadForm';

const STATUSES = ['New', 'Contacted', 'Proposal Sent', 'Contract Sent', 'Cold'];

export default function Leads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  const loadData = async () => {
    const [leadList, userList] = await Promise.all([
      base44.entities.Lead.list('-created_date'),
      base44.entities.User.list(),
    ]);
    setLeads(leadList);
    setUsers(userList);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const maybeCreateClient = async (leadId) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    const existing = await base44.entities.Client.filter({ name: lead.company_name });
    if (existing.length === 0) {
      await base44.entities.Client.create({
        name: lead.company_name,
        contact_info: lead.contact_email || '',
        point_of_contact: lead.contact_name || '',
        notes: lead.notes || '',
      });
    }
  };

  const handleStatusChange = async (leadId, newStatus) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    await base44.entities.Lead.update(leadId, { status: newStatus });
    if (newStatus === 'Contract Sent') await maybeCreateClient(leadId);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
    </div>
  );

  const filteredLeads = activeFilter === 'All' ? leads : leads.filter(l => l.status === activeFilter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-foreground">Leads</h1>
          <p className="text-muted-foreground mt-1">{leads.length} lead{leads.length !== 1 ? 's' : ''} in pipeline</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
          <Plus className="w-4 h-4 mr-2" /> New Lead
        </Button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveFilter('All')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${activeFilter === 'All' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
        >
          All ({leads.length})
        </button>
        {STATUSES.map(status => {
          const count = leads.filter(l => l.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setActiveFilter(status)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${activeFilter === status ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
            >
              {status} ({count})
            </button>
          );
        })}
      </div>

      {filteredLeads.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-muted-foreground">{activeFilter === 'All' ? 'No leads yet. Create your first lead to get started.' : `No leads with status "${activeFilter}".`}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredLeads.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              owner={users.find(u => u.id === lead.assigned_to)}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {showForm && <LeadForm users={users} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); loadData(); }} />}
    </div>
  );
}