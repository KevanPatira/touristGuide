// hooks/useChat.js — Send/receive messages in a chat room
import { useState, useEffect } from 'react';
import {
  collection, query, orderBy, onSnapshot, addDoc, doc,
  updateDoc, serverTimestamp, setDoc, getDoc, limit,
} from 'firebase/firestore';
import { db } from '../constants/firebaseConfig';

// Generate a deterministic chat ID from two user IDs
export function getChatId(uid1, uid2) {
  return [uid1, uid2].sort().join('_');
}

export default function useChat(chatId, currentUserId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // ═══ Subscribe to messages ═══
  useEffect(() => {
    if (!chatId) return;

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(50));

    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      }));
      setMessages(msgs);
      setLoading(false);
    });

    return unsub;
  }, [chatId]);

  // ═══ Send a message ═══
  const sendMessage = async (text, otherUserId) => {
    if (!text.trim() || !chatId || !currentUserId) return;

    const chatRef = doc(db, 'chats', chatId);
    const messagesRef = collection(db, 'chats', chatId, 'messages');

    // Ensure the chat document exists
    const chatSnap = await getDoc(chatRef);
    if (!chatSnap.exists()) {
      await setDoc(chatRef, {
        participants: [currentUserId, otherUserId].sort(),
        lastMessage: text.trim(),
        lastMessageAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
    } else {
      // Update last message
      await updateDoc(chatRef, {
        lastMessage: text.trim(),
        lastMessageAt: serverTimestamp(),
      });
    }

    // Add message to subcollection
    await addDoc(messagesRef, {
      senderId: currentUserId,
      text: text.trim(),
      createdAt: serverTimestamp(),
      readBy: [currentUserId],
    });
  };

  return { messages, loading, sendMessage };
}
