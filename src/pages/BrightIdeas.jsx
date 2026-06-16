import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Lightbulb, Plus, Sparkles, Loader2, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CATEGORIES = ['Marketing', 'Operations', 'Growth', 'Creative', 'Tech', 'Other'];
const STATUSES = ['Fresh', 'Exploring', 'In Motion', 'Done', 'Parked'];

const STATUS_COLORS = {
  'Fresh': 'bg-purple-500/10 text-purple-400',
  'Exploring': 'bg-blue-500/10 text-blue-400',
  'In Motion': 'bg-amber-500/10 text-amber-400',
  'Done': 'bg-green-500/10 text-green-400',
  'Parked': 'bg-slate-500/10 text-slate-400',
};

const CATEGORY_ICONS = {
  'Marketing': '📣',
  'Operations': '⚙️',
  'Growth': '📈',
  'Creative': '🎨',
  'Tech': '💻',
  'Other': '💡',
};

export default function BrightIdeas() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const loadIdeas = async () => {
    const list = await base44.entities.BrightIdea.list('-created_date');
    setIdeas(list);
    setLoading(false);
  };

  useEffect(() => { loadIdeas(); }, []);

  const handleDrop = async () => {
    if (!input.trim()) return;
    setProcessing(true);
    try {
      await base44.functions.invoke('processBrightIdea', { idea: input });
      setInput('');
      await loadIdeas();
    } catch {}
    setProcessing(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.BrightIdea.delete(id);
    setIdeas(prev => prev.filter(i => i.id !== id));
  };

  const handleStatusChange = async (id, newStatus) => {
    await base44.entities.BrightIdea.update(id, { status: newStatus });
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
  };

  const handleEditSave = async (id) => {
    await base44.entities.BrightIdea.update(id, { content: editText });
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, content: editText } : i));
    setEditingId(null);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-extrabold text-foreground flex items-center gap-3">
          <Lightbulb className="w-7 h-7 text-amber-400" />
          Bright Ideas
        </h1>
        <p className="text-muted-foreground mt-1">Capture your brilliance before it escapes</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-heading font-bold text-foreground">Drop a bright idea</span>
        </div>
        <div className="flex gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleDrop(); }}
            placeholder="e.g. What if we offered a 'design sprint' package for new clients?"
            className="flex-1 bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
          <Button
            onClick={handleDrop}
            disabled={processing || !input.trim()}
            className="bg-amber-400 text-black hover:bg-amber-300 font-semibold flex-shrink-0"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      ) : ideas.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Lightbulb className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No bright ideas yet. Drop one above!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ideas.map(idea => (
            <div key={idea.id} className="bg-card rounded-xl border border-border p-4 hover:border-accent/30 transition-colors">
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5 flex-shrink-0">{CATEGORY_ICONS[idea.category] || '💡'}</span>
                <div className="flex-1 min-w-0">
                  {editingId === idea.id ? (
                    <div className="flex gap-2">
                      <input
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        className="flex-1 bg-muted border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                        autoFocus
                      />
                      <Button size="sm" onClick={() => handleEditSave(idea.id)} className="bg-accent text-accent-foreground h-8 text-xs">Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-8 text-xs">Cancel</Button>
                    </div>
                  ) : (
                    <p className="text-sm text-foreground leading-relaxed">{idea.content}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{idea.category}</span>
                    <select
                      value={idea.status}
                      onChange={e => handleStatusChange(idea.id, e.target.value)}
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border-none cursor-pointer ${STATUS_COLORS[idea.status]}`}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <span className="text-[10px] text-muted-foreground">{new Date(idea.created_date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => { setEditingId(idea.id); setEditText(idea.content); }}
                    className="text-muted-foreground hover:text-foreground p-1 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(idea.id)}
                    className="text-muted-foreground hover:text-red-400 p-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}