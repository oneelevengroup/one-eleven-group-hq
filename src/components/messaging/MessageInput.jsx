import React, { useState } from 'react';
import { Send } from 'lucide-react';

export default function MessageInput({ onSend }) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || sending) return;
    setSending(true);
    await onSend(content.trim());
    setContent('');
    setSending(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-3 border-t border-border bg-background">
      <input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type a message..."
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
  );
}