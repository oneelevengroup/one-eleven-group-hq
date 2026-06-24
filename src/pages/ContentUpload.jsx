import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Plus, Upload, X, Calendar, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { getTeamMembers } from '@/lib/getTeamMembers';

const STATUS_STYLES = {
  'Pending': 'bg-slate-500/10 text-slate-500',
  'In Progress': 'bg-amber-500/10 text-amber-600',
  'Uploaded': 'bg-green-500/10 text-green-600',
};

const STATUS_ICONS = {
  'Pending': <Clock className="w-3.5 h-3.5" />,
  'In Progress': <Loader2 className="w-3.5 h-3.5" />,
  'Uploaded': <CheckCircle2 className="w-3.5 h-3.5" />,
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ContentUpload() {
  const [sessions, setSessions] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const loadData = async () => {
    const results = await Promise.allSettled([
      base44.entities.ContentSession.list('-session_date'),
      base44.entities.Client.list(),
      getTeamMembers(),
    ]);
    setSessions(results[0].status === 'fulfilled' ? results[0].value : []);
    setClients(results[1].status === 'fulfilled' ? results[1].value : []);
    setUsers(results[2].status === 'fulfilled' ? results[2].value : []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const getClientName = (clientId) => {
    const c = clients.find(c => c.id === clientId);
    return c?.name || sessions.find(s => s.id === clientId)?.client_name || 'Unknown';
  };

  const handleStatusChange = async (sessionId, newStatus) => {
    setUpdatingId(sessionId);
    try {
      await base44.entities.ContentSession.update(sessionId, { upload_status: newStatus });
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, upload_status: newStatus } : s));
    } catch (err) {
      console.error('Status update error:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-foreground">Content Upload</h1>
          <p className="text-muted-foreground mt-1">Track content sessions and upload status</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
          <Plus className="w-4 h-4 mr-2" /> New Session
        </Button>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground">No content sessions yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide">Session Date</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Notes</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(session => (
                  <tr key={session.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {session.client_name && <span className="text-sm font-medium text-foreground">{session.client_name}</span>}
                        {!session.client_name && (
                          <span className="text-sm font-medium text-foreground">{getClientName(session.client_id)}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> {formatDate(session.session_date)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={session.upload_status}
                        onChange={(e) => handleStatusChange(session.id, e.target.value)}
                        disabled={updatingId === session.id}
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 ${STATUS_STYLES[session.upload_status] || 'bg-muted text-muted-foreground'}`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Uploaded">Uploaded</option>
                      </select>
                      {session.upload_email_sent && (
                        <span className="ml-2 text-[10px] text-green-500 font-medium" title="Karlee has been notified">
                          <CheckCircle2 className="w-3 h-3 inline" /> notified
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-muted-foreground truncate max-w-xs block">{session.notes || '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <ContentSessionForm
          clients={clients}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); loadData(); }}
        />
      )}
    </div>
  );
}

function ContentSessionForm({ clients, onClose, onSaved }) {
  const [form, setForm] = useState({
    client_id: '',
    session_date: new Date().toISOString().split('T')[0],
    upload_status: 'Pending',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.client_id || !form.session_date) return;
    setSaving(true);
    const selectedClient = clients.find(c => c.id === form.client_id);
    await base44.entities.ContentSession.create({
      ...form,
      client_name: selectedClient?.name || '',
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-md border border-border shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-heading font-bold text-lg text-foreground">New Content Session</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Client</label>
            <select
              value={form.client_id}
              onChange={e => setForm({ ...form, client_id: e.target.value })}
              required
              className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              <option value="">Select client</option>
              {clients.map(c => <option key={!c.id ? "_fallback" : c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Session Date</label>
            <input
              type="date"
              value={form.session_date}
              onChange={e => setForm({ ...form, session_date: e.target.value })}
              required
              className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Upload Status</label>
            <select
              value={form.upload_status}
              onChange={e => setForm({ ...form, upload_status: e.target.value })}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Uploaded">Uploaded</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent/50"
              placeholder="Any details about this content session..."
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-border">Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">{saving ? 'Saving...' : 'Create Session'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}