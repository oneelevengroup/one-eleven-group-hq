import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, ChevronRight, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ClientForm from '@/components/clients/ClientForm';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  const loadData = async () => {
    const [clientList, taskList, userList] = await Promise.all([
      base44.entities.Client.list(),
      base44.entities.Task.list(),
      base44.entities.User.list(),
    ]);
    setClients(clientList);
    setTasks(taskList);
    setUsers(userList);
    setLoading(false);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map(client => {
            const counts = getTaskCount(client.id);
            return (
              <Link key={client.id} to={`/clients/${client.id}`} className="bg-card rounded-xl border border-border p-5 hover:border-accent/50 transition-colors group">
                <div className="flex items-center gap-3 mb-3">
                  {client.color_tag && <span className="w-4 h-4 rounded-full flex-shrink-0" style={{backgroundColor: client.color_tag}} />}
                  <h3 className="font-heading font-bold text-foreground text-lg truncate">{client.name}</h3>
                  <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">{counts.total} task{counts.total !== 1 ? 's' : ''}</span>
                  {counts.open > 0 && <span className="text-accent font-semibold">{counts.open} open</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {showForm && <ClientForm client={editingClient} users={users} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); loadData(); }} />}
    </div>
  );
}