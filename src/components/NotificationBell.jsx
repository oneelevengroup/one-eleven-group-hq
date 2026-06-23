import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, MessageSquare, AtSign } from 'lucide-react';
import { useNotifications } from '@/lib/useNotifications';

function formatTime(date) {
  const d = new Date(date);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function NotificationBell() {
  const { notifications, unreadCount, markRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-popover border border-border rounded-xl shadow-xl overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No new notifications</p>
              </div>
            ) : (
              notifications.map(notif => (
                <Link
                  key={notif.id}
                  to={`/messages?conv=${notif.conversation_id || ''}`}
                  onClick={() => { markRead(notif.id); setOpen(false); }}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-muted transition-colors border-b border-border/50 last:border-0"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: notif.type === 'mention' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(165, 248, 211, 0.15)' }}
                  >
                    {notif.type === 'mention'
                      ? <AtSign className="w-4 h-4 text-purple-500" />
                      : <MessageSquare className="w-4 h-4 text-accent" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">{notif.sender_name || 'Someone'}</span>
                      <span className="text-muted-foreground">
                        {notif.type === 'mention' ? ' mentioned you' : ' sent you a message'}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{notif.snippet}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {notif.created_date ? formatTime(notif.created_date) : ''}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}