import React, { useState } from 'react';
import { Hash, Lock, Plus, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { getDisplayName } from '@/lib/utils';

export default function ConversationList({ conversations, users, currentUser, selectedId, onSelect, onCreated }) {
  const [showNew, setShowNew] = useState(null);
  const [name, setName] = useState('');
  const [dmUserId, setDmUserId] = useState('');
  const [creating, setCreating] = useState(false);

  const channels = conversations.filter(c => c.type === 'channel');
  const directs = conversations.filter(c => c.type === 'direct' && c.members.includes(currentUser.id));

  const handleCreateChannel = async () => {
    if (!name.trim() || creating) return;
    setCreating(true);
    await base44.entities.Conversation.create({
      name: name.trim(),
      type: 'channel',
      members: [currentUser.id],
      description: '',
    });
    setName('');
    setShowNew(null);
    setCreating(false);
    onCreated();
  };

  const handleStartDM = async () => {
    if (!dmUserId || creating) return;
    setCreating(true);
    const existing = directs.find(d =>
      d.members.length === 2 && d.members.includes(dmUserId) && d.members.includes(currentUser.id)
    );
    if (existing) {
      onSelect(existing.id);
      setShowNew(null);
      setDmUserId('');
      setCreating(false);
      return;
    }
    await base44.entities.Conversation.create({
      name: '',
      type: 'direct',
      members: [currentUser.id, dmUserId],
    });
    setDmUserId('');
    setShowNew(null);
    setCreating(false);
    onCreated();
  };

  const otherUsers = users.filter(u => u.id !== currentUser.id);

  return (
    <div className="flex flex-col h-full bg-[#1a6b7a]">
      <div className="p-4 border-b border-[#238396]">
        <h2 className="font-heading font-extrabold text-base text-white">Messages</h2>
      </div>

      <div className="flex-1 overflow-y-auto py-3">
        {/* Channels */}
        <div className="px-3 mb-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-accent" />
              <span className="text-[11px] font-bold text-accent uppercase tracking-wider">Channels</span>
            </div>
            <button onClick={() => setShowNew('channel')} className="text-accent hover:text-white transition-colors">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          {channels.map(c => (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-left transition-all ${
                selectedId === c.id
                  ? 'bg-accent text-accent-foreground font-semibold'
                  : 'text-accent/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Hash className={`w-4 h-4 flex-shrink-0 ${selectedId === c.id ? 'text-accent-foreground' : ''}`} />
              <span className="truncate lowercase">{c.name}</span>
            </button>
          ))}
        </div>

        {/* Direct Messages */}
        <div className="px-3">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-accent" />
              <span className="text-[11px] font-bold text-accent uppercase tracking-wider">Direct Messages</span>
            </div>
            <button onClick={() => setShowNew('dm')} className="text-accent hover:text-white transition-colors">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          {directs.map(c => {
            const otherUserId = c.members.find(id => id !== currentUser.id);
            const otherUser = users.find(u => u.id === otherUserId);
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-left transition-all ${
                  selectedId === c.id
                    ? 'bg-accent text-accent-foreground font-semibold'
                    : 'text-accent/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${selectedId === c.id ? 'bg-accent-foreground/20' : 'bg-white/10'}`}>
                  <Lock className={`w-2.5 h-2.5 ${selectedId === c.id ? 'text-accent-foreground' : 'text-accent'}`} />
                </div>
                <span className="truncate">{getDisplayName(otherUser) || 'Unknown'}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* New Channel / DM Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl w-full max-w-sm border border-border shadow-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-sm text-foreground">
                {showNew === 'channel' ? 'New Channel' : 'New Direct Message'}
              </h3>
              <button onClick={() => { setShowNew(null); setName(''); setDmUserId(''); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            {showNew === 'channel' ? (
              <>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Channel name"
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 mb-3"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateChannel()}
                />
                <Button size="sm" onClick={handleCreateChannel} disabled={!name.trim() || creating} className="w-full bg-accent text-accent-foreground">
                  {creating ? 'Creating...' : 'Create Channel'}
                </Button>
              </>
            ) : (
              <>
                <select
                  value={dmUserId}
                  onChange={(e) => setDmUserId(e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 mb-3"
                >
                  <option value="">Select team member</option>
                  {otherUsers.map(u => (
                    <option key={u.id} value={u.id}>{getDisplayName(u)}</option>
                  ))}
                </select>
                <Button size="sm" onClick={handleStartDM} disabled={!dmUserId || creating} className="w-full bg-accent text-accent-foreground">
                  {creating ? 'Starting...' : 'Start Conversation'}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}