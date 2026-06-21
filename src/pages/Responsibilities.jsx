import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Plus, Repeat, Clock, ShieldCheck } from 'lucide-react';
import ResponsibilityForm from '@/components/responsibilities/ResponsibilityForm';
import ResponsibilityCard from '@/components/responsibilities/ResponsibilityCard';
import MyResponsibilityItem from '@/components/responsibilities/MyResponsibilityItem';
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
  const [fullUser, setFullUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

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
    if (user?.id) setFullUser(userList.find(u => u.id === user.id) || null);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const isAdmin = fullUser?.role === 'admin' || user?.role === 'admin' ||
    /katie|maddie/i.test(fullUser?.full_name || '') || /katie|maddie/i.test(user?.full_name || '');

  const handleToggleComplete = async (r) => {
    await base44.entities.OngoingResponsibility.update(r.id, {
      completed_week: r.doneThisWeek ? '' : currentWeek,
    });
    loadData();
  };
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

  // My active items for the current week, grouped by client
  const myEmail = user?.email;
  const myItems = items.filter(r => r.assigned_to === myEmail && r.active);
  const myDone = myItems.filter(r => r.doneThisWeek).length;
  const myGrouped = myItems.reduce((acc, r) => {
    const key = r.client_id || '__none__';
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  // Admin: all items grouped by assigned staff
  const allGrouped = items.reduce((acc, r) => {
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
          <p className="text-muted-foreground mt-1">Recurring weekly client tasks · Week {currentWeek}</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setEditing(null); setShowForm(true); }} className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
            <Plus className="w-4 h-4 mr-2" /> New Responsibility
          </Button>
        )}
      </div>

      {/* My Ongoing Responsibilities — shown to everyone */}
      <div className="bg-card rounded-xl border border-border p-5 mb-8">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-heading font-bold text-foreground">My Ongoing Responsibilities</h3>
          <span className="text-sm font-semibold text-foreground">{myDone} of {myItems.length} done this week</span>
        </div>
        <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> Deadline: Friday 5pm ET — complete all items by then.
        </p>
        {myItems.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">You have no active ongoing responsibilities this week. 🎉</p>
        ) : (
          <div className="space-y-5">
            {Object.entries(myGrouped).map(([clientId, list]) => {
              const client = clientId === '__none__' ? null : clients.find(c => c.id === clientId);
              return (
                <div key={clientId}>
                  <div className="flex items-center gap-2 mb-2">
                    {client?.color_tag && <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: client.color_tag }} />}
                    <h4 className="font-heading font-bold text-xs text-foreground uppercase tracking-wide">{client ? client.name : 'No client'}</h4>
                    <span className="text-xs text-muted-foreground">({list.filter(r => r.doneThisWeek).length}/{list.length})</span>
                    <div className="flex-1 h-px bg-border ml-1" />
                  </div>
                  <div className="space-y-2">
                    {list.map(r => (
                      <MyResponsibilityItem key={r.id} responsibility={r} onToggle={handleToggleComplete} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Admin: management + team overview */}
      {isAdmin && (
        <>
          <div className="bg-card rounded-xl border border-border p-5 mb-8">
            <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-accent" /> Manage Responsibilities</h3>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No responsibilities yet. Click "New Responsibility" to create one.</p>
            ) : (
              <div className="space-y-6">
                {Object.entries(allGrouped).map(([email, list]) => {
                  const u = users.find(x => x.email === email);
                  return (
                    <div key={email}>
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-heading font-bold text-sm text-foreground uppercase tracking-wide">{u ? u.full_name : email}</h4>
                        <span className="text-xs text-muted-foreground">({list.length})</span>
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
                            onEdit={(item) => { setEditing(item); setShowForm(true); }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-accent" /> Team Overview — Week {currentWeek}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-border">
                    <th className="py-2 pr-4 font-heading font-bold text-foreground">Staff Member</th>
                    <th className="py-2 px-4 font-heading font-bold text-foreground">Active</th>
                    <th className="py-2 px-4 font-heading font-bold text-foreground">Done This Week</th>
                    <th className="py-2 pl-4 font-heading font-bold text-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const userItems = items.filter(r => r.assigned_to === u.email && r.active);
                    const done = userItems.filter(r => r.completed_week === currentWeek).length;
                    const total = userItems.length;
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                    return (
                      <tr key={u.id} className="border-b border-border last:border-0">
                        <td className="py-2.5 pr-4 text-foreground font-medium">{u.full_name}</td>
                        <td className="py-2.5 px-4 text-muted-foreground">{total}</td>
                        <td className="py-2.5 px-4 text-foreground font-semibold">{done}</td>
                        <td className="py-2.5 pl-4">
                          {total === 0 ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : done === total ? (
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-500/10 text-green-500">All complete</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-muted-foreground">{pct}%</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showForm && (
        <ResponsibilityForm
          clients={clients}
          users={users}
          currentUser={user}
          existing={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); loadData(); }}
        />
      )}
    </div>
  );
}