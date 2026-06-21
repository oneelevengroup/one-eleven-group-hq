import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Plus, Repeat, Clock } from 'lucide-react';
import ResponsibilityForm from '@/components/responsibilities/ResponsibilityForm';
import ResponsibilityBoardCard from '@/components/responsibilities/ResponsibilityBoardCard';
import { Button } from '@/components/ui/button';

// Week runs Monday-Sunday, resets Monday 00:00 America/New_York. Deadline Friday 5:00pm ET.
const getETInfo = (date = new Date()) => {
  const dateParts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(date);
  const y = Number(dateParts.find(p => p.type === 'year').value);
  const m = Number(dateParts.find(p => p.type === 'month').value);
  const d = Number(dateParts.find(p => p.type === 'day').value);
  const local = new Date(Date.UTC(y, m - 1, d));
  const weekday = local.getUTCDay(); // 0=Sun..6=Sat
  const tmp = new Date(Date.UTC(y, m - 1, d));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7);
  const weekId = `${tmp.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  const timeParts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(date);
  const hour = Number(timeParts.find(p => p.type === 'hour').value) % 24;
  const minute = Number(timeParts.find(p => p.type === 'minute').value);
  const pastDeadline = weekday === 0 || weekday === 6 || (weekday === 5 && (hour * 60 + minute) >= 17 * 60);
  return { weekId, pastDeadline };
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

  const { weekId: currentWeek, pastDeadline } = getETInfo();
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
  const handleDelete = async (r) => {
    await base44.entities.OngoingResponsibility.delete(r.id);
    loadData();
  };
  const handleEdit = (r) => { setEditing(r); setShowForm(true); };

  // Columns: one per staff member who has active responsibilities, current user first then alphabetical.
  const active = items.filter(r => r.active);
  const columns = users
    .filter(u => active.some(r => r.assigned_to === u.email))
    .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))
    .sort((a, b) => {
      if (a.email === user?.email) return -1;
      if (b.email === user?.email) return 1;
      return 0;
    });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-foreground flex items-center gap-2"><Repeat className="w-7 h-7 text-accent" /> Ongoing Responsibilities</h1>
          <p className="text-muted-foreground mt-1">Team board · Week {currentWeek}</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
          <Plus className="w-4 h-4 mr-2" /> New Responsibility
        </Button>
      </div>

      <p className={`text-xs mb-5 flex items-center gap-1.5 ${pastDeadline ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>
        <Clock className="w-3.5 h-3.5" /> {pastDeadline ? 'Deadline passed (Friday 5:00pm ET) — please complete ASAP.' : 'Deadline: Friday 5:00pm ET — complete all items by then.'}
      </p>

      {columns.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Repeat className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No active ongoing responsibilities this week.</p>
          {isAdmin && <p className="text-xs mt-1">Click "New Responsibility" to assign one.</p>}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map(u => {
            const userItems = active.filter(r => r.assigned_to === u.email);
            const done = userItems.filter(r => isDone(r)).length;
            const isMe = u.email === user?.email;
            return (
              <div key={u.id} className="w-72 shrink-0">
                <div className={`rounded-xl border p-3 mb-2 ${isMe ? 'bg-accent/15 border-accent/40' : 'bg-card border-border'}`}>
                  <h3 className="font-heading font-bold text-sm text-foreground truncate">
                    {u.full_name || u.email}{isMe && <span className="text-xs text-accent font-semibold ml-1.5">(You)</span>}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <span className="font-semibold text-foreground">{done}</span> of {userItems.length} done this week
                  </p>
                </div>
                <div className="space-y-2">
                  {userItems.map(r => (
                    <ResponsibilityBoardCard
                      key={r.id}
                      responsibility={r}
                      client={clients.find(c => c.id === r.client_id)}
                      doneThisWeek={isDone(r)}
                      canToggle={isMe || isAdmin}
                      canEdit={isMe || isAdmin}
                      onToggle={handleToggleComplete}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <ResponsibilityForm
          clients={clients}
          users={users}
          currentUser={user}
          existing={editing}
          isAdmin={isAdmin}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); loadData(); }}
        />
      )}
    </div>
  );
}