// hooks/useChat.js — Hybrid chat: MongoDB (source of truth) + Firebase (real-time)
import { useState, useEffect, useCallback, useRef } from 'react';
import * as chatService from '../services/chat.service';

// Firebase real-time imports (graceful fallback if unavailable)
let firebaseAvailable = false;
let collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, limit, db;
try {
  const firestore = require('firebase/firestore');
  const config = require('../constants/firebaseConfig');
  collection = firestore.collection;
  query = firestore.query;
  orderBy = firestore.orderBy;
  onSnapshot = firestore.onSnapshot;
  addDoc = firestore.addDoc;
  serverTimestamp = firestore.serverTimestamp;
  limit = firestore.limit;
  db = config.db;
  // Check if Firebase is actually configured
  if (db && typeof db.type === 'string') {
    firebaseAvailable = true;
  }
} catch (e) {
  console.log('[useChat] Firebase not available, using MongoDB polling fallback');
}

const POLL_INTERVAL = 5000; // 5s polling fallback when Firebase unavailable

/**
 * Generate a deterministic chat ID from two user IDs (for Firebase path only)
 */
export function getChatId(uid1, uid2) {
  return [uid1, uid2].sort().join('_');
}

export default function useChat(chatId, currentUserId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef(null);
  const knownIds = useRef(new Set()); // For deduplication

  // ═══ Load initial history from MongoDB (source of truth) ═══
  const loadHistory = useCallback(async () => {
    if (!chatId) return;
    try {
      const res = await chatService.getMessages(chatId, 1, 50);
      const msgs = (res.data || []).map(m => ({
        id: m._id || m.id,
        senderId: m.senderId,
        text: m.text,
        createdAt: m.createdAt,
        readBy: m.readBy || [],
      }));
      // Track known IDs
      msgs.forEach(m => knownIds.current.add(m.id));
      setMessages(msgs);
      setLoading(false);
    } catch (e) {
      console.log('[useChat] Load history failed:', e.message);
      setLoading(false);
    }
  }, [chatId]);

  // ═══ Subscribe to real-time updates ═══
  useEffect(() => {
    if (!chatId) return;

    // Load history from MongoDB first
    loadHistory();

    // Mark chat as read
    chatService.markChatAsRead(chatId).catch(() => {});

    // If Firebase is available, subscribe for real-time new messages
    if (firebaseAvailable && db) {
      try {
        const msgsRef = collection(db, 'chatMessages', String(chatId), 'messages');
        const q = query(msgsRef, orderBy('createdAt', 'desc'), limit(20));

        const unsub = onSnapshot(q, (snapshot) => {
          snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
              const data = change.doc.data();
              const msgId = data.mongoId || change.doc.id;
              // Deduplicate: only add if not already known
              if (!knownIds.current.has(msgId)) {
                knownIds.current.add(msgId);
                const newMsg = {
                  id: msgId,
                  senderId: data.senderId,
                  text: data.text,
                  createdAt: data.createdAt?.toDate?.() || new Date(),
                  readBy: data.readBy || [],
                };
                setMessages(prev => [newMsg, ...prev]);
              }
            }
          });
        }, (error) => {
          console.log('[useChat] Firebase listener error:', error.message);
          // Fall back to polling
          startPolling();
        });

        return () => {
          unsub();
          if (pollRef.current) clearInterval(pollRef.current);
        };
      } catch (e) {
        console.log('[useChat] Firebase subscribe failed, using polling:', e.message);
        startPolling();
      }
    } else {
      // No Firebase: poll MongoDB
      startPolling();
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [chatId, loadHistory]);

  // ═══ Polling fallback ═══
  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await chatService.getMessages(chatId, 1, 50);
        const msgs = (res.data || []).map(m => ({
          id: m._id || m.id,
          senderId: m.senderId,
          text: m.text,
          createdAt: m.createdAt,
          readBy: m.readBy || [],
        }));
        msgs.forEach(m => knownIds.current.add(m.id));
        setMessages(msgs);
      } catch (_) {}
    }, POLL_INTERVAL);
  }, [chatId]);

  // ═══ Send a message ═══
  const sendMessage = useCallback(async (text, otherUserId) => {
    if (!text.trim() || !chatId || !currentUserId) return;

    try {
      // 1. Store in MongoDB (source of truth) — gets backend-generated ID
      const res = await chatService.sendMessage(chatId, text.trim());
      const savedMsg = res.data;

      // 2. Add to local state immediately (optimistic)
      const newMsg = {
        id: savedMsg.messageId || savedMsg.id,
        senderId: currentUserId,
        text: text.trim(),
        createdAt: savedMsg.createdAt || new Date().toISOString(),
        readBy: [currentUserId],
      };

      if (!knownIds.current.has(newMsg.id)) {
        knownIds.current.add(newMsg.id);
        setMessages(prev => [newMsg, ...prev]);
      }

      // 3. Write to Firebase for real-time delivery to other user (if available)
      if (firebaseAvailable && db) {
        try {
          const msgsRef = collection(db, 'chatMessages', String(chatId), 'messages');
          await addDoc(msgsRef, {
            mongoId: savedMsg.messageId || savedMsg.id, // Link to MongoDB ID
            senderId: currentUserId,
            text: text.trim(),
            createdAt: serverTimestamp(),
            readBy: [currentUserId],
          });
        } catch (fbErr) {
          console.log('[useChat] Firebase write failed (message safe in MongoDB):', fbErr.message);
        }
      }
    } catch (e) {
      console.log('[useChat] Send failed:', e.message);
      throw e;
    }
  }, [chatId, currentUserId]);

  return { messages, loading, sendMessage };
}
