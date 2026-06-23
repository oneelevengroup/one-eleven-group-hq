import { useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef(null);

  const loadNotifications = useCallback(async () => {
    try {
      const user = await base44.auth.me();
      if (!user) { setLoading(false); return; }
      userIdRef.current = user.id;
      const notifs = await base44.entities.Notification.filter(
        { user_id: user.id, read: false },
        '-created_date',
        50
      );
      setNotifications(notifs);
      setUnreadCount(notifs.length);
    } catch (err) {
      console.error('Notifications load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const unsub = base44.entities.Notification.subscribe((event) => {
      if (event.type === 'create' && event.data.user_id === userIdRef.current) {
        setNotifications(prev => {
          if (prev.find(n => n.id === event.data.id)) return prev;
          return [event.data, ...prev];
        });
        setUnreadCount(prev => prev + 1);
      }
    });
    return () => { if (unsub) unsub(); };
  }, [loadNotifications]);

  const markRead = useCallback(async (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await base44.entities.Notification.update(notificationId, { read: true });
    } catch (err) {
      console.error('Mark read error:', err);
    }
  }, []);

  return { notifications, unreadCount, loading, markRead, reload: loadNotifications };
}