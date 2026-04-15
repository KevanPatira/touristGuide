// hooks/useNotifications.js — Retrieve and manage real-time notifications
import { useState, useEffect } from 'react';
import {
  collection, query, where, orderBy, limit, onSnapshot,
  doc, updateDoc,
} from 'firebase/firestore';
import { db } from '../constants/firebaseConfig';

export default function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const notifRef = collection(db, 'notifications');
    const q = query(
      notifRef,
      where('recipientId', '==', userId),
      // Notice: Removed orderBy('createdAt', 'desc') to prevent Firebase composite index errors.
      // We will sort the results locally instead.
      limit(50)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const notifs = [];
      let unread = 0;

      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        notifs.push({ id: docSnap.id, ...data });
        if (!data.read) {
          unread += 1;
        }
      });

      // Sort notifications locally (Descending)
      notifs.sort((a, b) => {
        const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return tB - tA;
      });

      setNotifications(notifs);
      setUnreadCount(unread);
      setLoading(false);
    });

    return unsub;
  }, [userId]);

  const markAsRead = async (notifId) => {
    try {
      await updateDoc(doc(db, 'notifications', notifId), { read: true });
    } catch (_) {}
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifs = notifications.filter(n => !n.read);
      for (const n of unreadNotifs) {
        await updateDoc(doc(db, 'notifications', n.id), { read: true });
      }
    } catch (_) {}
  };

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead };
}
