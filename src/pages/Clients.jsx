import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, ChevronRight, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ClientForm from '@/components/clients/ClientForm';
import SocialPlatforms from '@/components/clients/SocialPlatforms';
import { getTeamMembers } from '@/lib/getTeamMembers';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  const loadData = async () => {
    try {
      const results = await Promise.allSettled([
        base44.entities.Client.list(),
        base44.entities.Task.list(),
        getTeamMembers(),
      ]);
      setClients(results[0].status === 'fulfilled' ? results[0].value : []);
      setTasks(results[1].status === 'fulfilled' ? results[1].value : []);
      setUsers(results[2].status === 'fulfilled' ? results[2].value : []);
    } catch (err) {
      console.error('Clients load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const getTaskCount = (clientId) => ({
    total: tasks.filter(t => t.client_id === clientId).length,
    open: tasks.filter(t => t.client_id === clientId && t.status !== 'Done').length,
  });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-foreground">Clients</h1>
          <p className="text-muted-foreground mt-1">{clients.length} active client{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => { setEditingClient(null); setShowForm(true); }} className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
          <Plus className="w-4 h-4 mr-2" /> Add Client
        </Button>
      </div>

      {clients.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-muted-foreground">No clients yet. Add your first client to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(() => {
            const renderClient = (client) => {
              const counts = getTaskCount(client.id);
              return (
                <Link key={client.id} to={`/clients/${client.id}`} className="flex items-center gap-4 bg-card rounded-xl border border-border px-5 py-4 hover:border-accent/50 transition-colors group">
                  {client.color_tag && <span className="w-4 h-4 rounded-full flex-shrink-0" style={{backgroundColor: client.color_tag}} />}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-bold text-foreground text-base truncate">{client.name}</h3>
                    {client.industry && <p className="text-xs text-muted-foreground truncate">{client.industry}</p>}
                  </div>
                  <SocialPlatforms platforms={client.social_platforms} size="w-4 h-4" />
                  <div className="flex items-center gap-3 text-sm flex-shrink-0">
                    <span className="text-muted-foreground">{counts.total} task{counts.total !== 1 ? 's' : ''}</span>
                    {counts.open > 0 && <span className="text-accent font-semibold">{counts.open} open</span>}
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </Link>
              );
            };
            const renderColumn = (title, list) => (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="font-heading font-bold text-sm text-foreground uppercase tracking-wide">{title}</h2>
                  <span className="text-xs text-muted-foreground">({list.length})</span>
                  <div className="flex-1 h-px bg-border ml-1" />
                </div>
                <div className="space-y-2">
                  {list.map(renderClient)}
                </div>
              </div>
            );
            const retainerClients = clients.filter(c => c.client_type === 'Retainer');
            const alacarteClients = clients.filter(c => c.client_type === 'A La Carte Project');
            const uncategorized = clients.filter(c => !c.client_type);
            return (
              <>
                <div className="space-y-6">
                  {renderColumn('Retainer Clients', retainerClients)}
                  {uncategorized.length > 0 && renderColumn('Uncategorized', uncategorized)}
                </div>
                {renderColumn('A La Carte / Project Clients', alacarteClients)}
              </>
            );
          })()}
        </div>
      )}

      {showForm && <ClientForm client={editingClient} users={users} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); loadData(); }} />}
    </div>
  );
}