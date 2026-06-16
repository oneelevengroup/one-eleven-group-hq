import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LeadCard from '@/components/leads/LeadCard';
import LeadForm from '@/components/leads/LeadForm';

const STATUSES = ['New', 'Contacted', 'Proposal Sent', 'Won', 'Lost'];

const STATUS_HEADER_COLORS = {
  'New': 'border-t-purple-400',
  'Contacted': 'border-t-blue-400',
  'Proposal Sent': 'border-t-amber-400',
  'Won': 'border-t-green-400',
  'Lost': 'border-t-red-400',
};

export default function Leads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-foreground">Leads</h1>
          <p className="text-muted-foreground mt-1">{leads.length} lead{leads.length !== 1 ? 's' : ''} in pipeline</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
          <Plus className="w-4 h-4 mr-2" /> New Lead
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {STATUSES.map(status => {
          const statusLeads = leads.filter(l => l.status === status);
          return (
            <div key={status} className={`bg-muted/40 rounded-xl p-4 border-t-2 ${STATUS_HEADER_COLORS[status]}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-bold text-sm text-foreground">{status}</h3>
                <span className="text-xs text-muted-foreground bg-card px-2 py-0.5 rounded-full font-medium">{statusLeads.length}</span>
              </div>
              <div className="space-y-2">
                {statusLeads.map(lead => (
                  <LeadCard key={lead.id} lead={lead} owner={users.find(u => u.id === lead.assigned_to)} />
                ))}
                {statusLeads.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-3">No leads</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showForm && <LeadForm users={users} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); loadData(); }} />}
    </div>
  );
}