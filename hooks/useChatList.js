// hooks/useChatList.js — Chat list backed by MongoDB API
import { useState, useEffect, useCallback, useRef } from 'react';
import * as chatService from '../services/chat.service';

const POLL_INTERVAL = 15000; // 15s refresh for chat list

export default function useChatList(userId) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchChats = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await chatService.getUserChats();
      setChats(res.data || []);
    } catch (e) {
      console.log('[useChatList] Fetch failed:', e.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchChats();
    intervalRef.current = setInterval(fetchChats, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [userId, fetchChats]);

  const refresh = useCallback(() => {
    fetchChats();
  }, [fetchChats]);

  return { chats, loading, refresh };
}
