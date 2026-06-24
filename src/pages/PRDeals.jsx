import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Plus, Gift, Trash2, Pencil, Lock } from 'lucide-react';
import PRDealForm from '@/components/pr/PRDealForm';

const STATUS_COLORS = {
  'Pitched': 'bg-blue-500/10 text-blue-600',
  'In talks': 'bg-amber-500/10 text-amber-600',
  'Confirmed': 'bg-purple-500/10 text-purple-600',
  'Delivered': 'bg-cyan-500/10 text-cyan-600',
  'Paid': 'bg-green-500/10 text-green-600',
};

const DEAL_TYPE_COLORS = {
  'Gifted': 'bg-pink-500/10 text-pink-600',
  'Paid': 'bg-green-500/10 text-green-600',
  'UGC': 'bg-purple-500/10 text-purple-600',
  'Affiliate': 'bg-orange-500/10 text-orange-600',
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtMoney(v) {
  if (v === null || v === undefined || v === '') return '—';
  return '$' + Number(v).toLocaleString('en-US');
}

export default function PRDeals() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadDeals = async () => {
    try {
      const res = await base44.functions.invoke('managePRDeals', { action: 'list' });
      setDeals(res.data?.deals || []);
    } catch (err) {
      setError('Unable to load PR deals. You may not have access.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDeals(); }, []);

  const handleSave = async (id, formData) => {
    setActionLoading(true);
    try {
      if (id) {
        await base44.functions.invoke('managePRDeals', { action: 'update', id, deal: formData });
      } else {
        await base44.functions.invoke('managePRDeals', { action: 'create', deal: formData });
      }
      setShowForm(false);
      setEditingDeal(null);
      await loadDeals();
    } catch (err) {
      console.error('PR deal save error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this PR deal?')) return;
    setActionLoading(true);
    try {
      await base44.functions.invoke('managePRDeals', { action: 'delete', id });
      await loadDeals();
    } catch (err) {
      console.error('PR deal delete error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-64">
      <Lock className="w-10 h-10 text-muted-foreground/40 mb-3" />
      <p className="text-muted-foreground text-sm">{error}</p>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-foreground">PR / Brand Deals</h1>
          <p className="text-muted-foreground mt-1">Track brand partnerships, gifted collaborations, and paid deals</p>
        </div>
        <Button onClick={() => { setEditingDeal(null); setShowForm(true); }} className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
          <Plus className="w-4 h-4 mr-2" /> New Deal
        </Button>
      </div>

      {deals.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Gift className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground">No PR deals yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide">Brand</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Value</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Pitched</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Due</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide hidden xl:table-cell">Deliverables</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {deals.map(deal => (
                  <tr key={deal.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-foreground">{deal.brand_company}</p>
                      {deal.contact && <p className="text-xs text-muted-foreground">{deal.contact}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${DEAL_TYPE_COLORS[deal.deal_type] || 'bg-muted text-muted-foreground'}`}>{deal.deal_type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[deal.status] || 'bg-muted text-muted-foreground'}`}>{deal.status}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm font-medium text-foreground">{fmtMoney(deal.value)}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground">{fmtDate(deal.date_pitched)}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground">{fmtDate(deal.date_due)}</span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-sm text-muted-foreground truncate max-w-[180px] block">{deal.deliverables || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => { setEditingDeal(deal); setShowForm(true); }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          disabled={actionLoading}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(deal.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          disabled={actionLoading}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <PRDealForm
          deal={editingDeal}
          onClose={() => { setShowForm(false); setEditingDeal(null); }}
          onSaved={handleSave}
          saving={actionLoading}
        />
      )}
    </div>
  );
}