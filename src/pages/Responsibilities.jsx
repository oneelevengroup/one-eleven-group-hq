import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Plus, Repeat } from 'lucide-react';
import ResponsibilityForm from '@/components/responsibilities/ResponsibilityForm';
import ResponsibilityCard from '@/components/responsibilities/ResponsibilityCard';
import { Button } from '@/components/ui/button';

// Returns the ISO week id for a date, e.g. "2026-W25".
const getISOWeek = (date = new Date()) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
};

export default function Responsibilities() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');

  const currentWeek = getISOWeek();
  const isDone = (r) => r.completed_week === currentWeek;

  const loadData = async () => {
    const [respList, clientList, userList] = await Promise.all([
      base44.entities.OngoingResponsibility.list('-created_date'),
      base44.entities.Client.list(),
      base44.entities.User.list(),
    ]);
    setItems(respList.map(r => ({ ...r, doneThisWeek: isDone(r) })));
    setClients(clientList);
    setUsers(userList);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleComplete = async (r) => {
    await base44.entities.OngoingResponsibility.update(r.id, { completed_week: currentWeek });
    loadData();
  };
  const handleDelete = async (r) => {
    await base44.entities.OngoingResponsibility.delete(r.id);
    loadData();
  };
  const handleToggleActive = async (r) => {
    await base44.entities.OngoingResponsibility.update(r.id, { active: !r.active });
    loadData();
  };

  const filtered = items.filter(r => {
    if (filter === 'mine') return r.assigned_to === user?.email;
    if (filter === 'pending') return r.active && !r.doneThisWeek;
    return true;
  });

  const grouped = filtered.reduce((acc, r) => {
    if (!acc[r.assigned_to]) acc[r.assigned_to] = [];
    acc[r.assigned_to].push(r);
    return acc;
  }, {});

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-foreground flex items-center gap-2"><Repeat className="w-7 h-7 text-accent" /> Ongoing Responsibilities</h1>
          <p className="text-muted-foreground mt-1">Recurring weekly client tasks, tracked per staff member · Week {currentWeek}</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
          <Plus className="w-4 h-4 mr-2" /> New Responsibility
        </Button>
      </div>

      <div className="mb-6 flex items-center gap-2 flex-wrap">
        {[{ k: 'all', l: 'All' }, { k: 'mine', l: 'Mine' }, { k: 'pending', l: 'Pending this week' }].map(f => (
          <button key={f.k} onClick={() => setFilter(f.k)} className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${filter === f.k ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>{f.l}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Repeat className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No ongoing responsibilities yet. Create one to start tracking weekly client work.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([email, list]) => {
            const u = users.find(x => x.email === email);
            const pendingCount = list.filter(r => r.active && !r.doneThisWeek).length;
            return (
              <div key={email}>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-heading font-bold text-sm text-foreground uppercase tracking-wide">{u ? u.full_name : email}</h3>
                  <span className="text-xs text-muted-foreground">({list.length})</span>
                  {pendingCount > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500">{pendingCount} pending</span>}
                  <div className="flex-1 h-px bg-border ml-1" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {list.map(r => (
                    <ResponsibilityCard
                      key={r.id}
                      responsibility={r}
                      client={clients.find(c => c.id === r.client_id)}
                      assignee={u}
                      onComplete={handleComplete}
                      onDelete={handleDelete}
                      onToggleActive={handleToggleActive}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && <ResponsibilityForm clients={clients} users={users} currentUser={user} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); loadData(); }} />}
    </div>
  );
}