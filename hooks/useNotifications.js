// hooks/useNotifications.js — Notifications backed by MongoDB API (polling)
import { useState, useEffect, useCallback, useRef } from 'react';
import * as notifService from '../services/notification.service';

const POLL_INTERVAL = 30000; // 30 seconds

export default function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await notifService.getNotifications(1, 50);
      setNotifications(res.data || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (e) {
      console.log('[useNotifications] Fetch failed:', e.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial fetch + polling
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [userId, fetchNotifications]);

  const markAsRead = useCallback(async (notifId) => {
    try {
      await notifService.markAsRead(notifId);
      setNotifications(prev =>
        prev.map(n => n.id === notifId || n._id === notifId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (_) {}
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notifService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (_) {}
  }, []);

  const refresh = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, refresh };
}
