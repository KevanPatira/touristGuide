// hooks/useChatList.js — Subscribe to user's chat conversations
import { useState, useEffect } from 'react';
import {
  collection, query, where, orderBy, onSnapshot, doc, getDoc,
} from 'firebase/firestore';
import { db } from '../constants/firebaseConfig';

export default function useChatList(userId) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', userId),
      orderBy('lastMessageAt', 'desc')
    );

    const unsub = onSnapshot(q, async (snapshot) => {
      const chatList = [];

      for (const chatDoc of snapshot.docs) {
        const data = chatDoc.data();
        // Find the other participant
        const otherUserId = data.participants.find(id => id !== userId);

        // Fetch their profile
        let otherUser = { displayName: 'Unknown', username: 'unknown', avatarUrl: '' };
        if (otherUserId) {
          try {
            const userSnap = await getDoc(doc(db, 'users', otherUserId));
            if (userSnap.exists()) {
              otherUser = userSnap.data();
            }
          } catch (_) {}
        }

        chatList.push({
          id: chatDoc.id,
          ...data,
          otherUserId,
          otherUserName: otherUser.displayName || 'Unknown',
          otherUserAvatar: otherUser.avatarUrl || '',
          otherUsername: otherUser.username || 'unknown',
        });
      }

      setChats(chatList);
      setLoading(false);
    });

    return unsub;
  }, [userId]);

  return { chats, loading };
}
