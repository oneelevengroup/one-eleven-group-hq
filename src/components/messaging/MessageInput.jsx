import React, { useState, useRef } from 'react';
import { Send } from 'lucide-react';
import { getDisplayName } from '@/lib/utils';

export default function MessageInput({ onSend, users = [] }) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionStart, setMentionStart] = useState(-1);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);

  const filteredUsers = mentionQuery !== null
    ? users.filter(u => {
        const name = getDisplayName(u).toLowerCase();
        return name.includes(mentionQuery.toLowerCase());
      }).slice(0, 6)
    : [];

  const handleChange = (e) => {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart;
    setContent(val);

    const beforeCursor = val.substring(0, cursorPos);
    const atMatch = beforeCursor.match(/@(\w*)$/);
    if (atMatch) {
      setMentionQuery(atMatch[1]);
      setMentionStart(cursorPos - atMatch[0].length);
      setSelectedIdx(0);
    } else {
      setMentionQuery(null);
      setMentionStart(-1);
    }
  };

  const insertMention = (user) => {
    const displayName = getDisplayName(user);
    const cursorPos = inputRef.current?.selectionStart || content.length;
    const before = content.substring(0, mentionStart);
    const after = content.substring(cursorPos);
    const newText = `${before}@${displayName} ${after}`;
    setContent(newText);
    setMentionQuery(null);
    setMentionStart(-1);
    const newPos = before.length + displayName.length + 2; // @name + space
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const handleKeyDown = (e) => {
    if (mentionQuery !== null && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx(prev => (prev + 1) % filteredUsers.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx(prev => (prev - 1 + filteredUsers.length) % filteredUsers.length);
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        insertMention(filteredUsers[selectedIdx]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionQuery(null);
        setMentionStart(-1);
        return;
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || sending) return;
    setSending(true);
    await onSend(content.trim());
    setContent('');
    setSending(false);
  };

  return (
    <div className="relative">
      {mentionQuery !== null && filteredUsers.length > 0 && (
        <div className="absolute bottom-full left-4 right-4 mb-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-30 max-h-48 overflow-y-auto">
          {filteredUsers.map((u, idx) => (
            <button
              key={u.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); insertMention(u); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                idx === selectedIdx ? 'bg-accent/15 text-accent' : 'text-foreground hover:bg-muted'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                {getDisplayName(u).charAt(0).toUpperCase()}
              </div>
              {getDisplayName(u)}
            </button>
          ))}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-3 border-t border-border bg-background">
        <input
          ref={inputRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... Use @ to tag someone"
          className="flex-1 bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
          autoFocus
        />
        <button
          type="submit"
          disabled={!content.trim() || sending}
          className="w-9 h-9 bg-accent text-accent-foreground rounded-xl flex items-center justify-center hover:bg-accent/90 transition-colors disabled:opacity-40 flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}