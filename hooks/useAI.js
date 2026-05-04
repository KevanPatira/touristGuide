// hooks/useAI.js — Hook for AI chat using Gemini API directly
import { useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { askGeminiAI } from '../services/ai.service';

const CHAT_STORAGE_KEY = '@touristguide_ai_chat_history';
const MAX_STORED_MESSAGES = 50;

/**
 * Custom hook for AI chat functionality.
 * Uses Gemini API directly for reliable connectivity.
 * Manages messages, loading state, error handling, and local persistence.
 */
export default function useAI() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load chat history from AsyncStorage.
   */
  const loadChatHistory = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setMessages(parsed);
        return parsed;
      }
    } catch (e) {
      console.log('[useAI] Error loading history:', e.message);
    }
    return [];
  }, []);

  /**
   * Persist messages to AsyncStorage.
   */
  const saveChatHistory = useCallback(async (msgs) => {
    try {
      const toStore = msgs.slice(-MAX_STORED_MESSAGES);
      await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(toStore));
    } catch (e) {
      console.log('[useAI] Error saving history:', e.message);
    }
  }, []);

  /**
   * Send a prompt to Gemini AI and update messages.
   * @param {string} prompt — User's message text
   */
  const sendMessage = useCallback(async (prompt) => {
    if (!prompt || prompt.trim().length === 0) return;

    const trimmedPrompt = prompt.trim();
    setError(null);

    // Create user message
    const userMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: trimmedPrompt,
      timestamp: new Date().toISOString(),
    };

    // Optimistically add user message
    const updatedWithUser = [...messages, userMessage];
    setMessages(updatedWithUser);
    saveChatHistory(updatedWithUser);

    setLoading(true);

    try {
      // Build conversation history for context (role + content only)
      const conversationHistory = messages
        .filter(m => !m.isError) // Skip error messages
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      // Call Gemini directly
      const reply = await askGeminiAI(trimmedPrompt, conversationHistory);

      if (!reply) {
        throw new Error('Empty response from AI');
      }

      const aiMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => {
        const updated = [...prev, aiMessage];
        saveChatHistory(updated);
        return updated;
      });
    } catch (err) {
      let errorMessage = 'Something went wrong. Please try again.';

      if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);

      // Add error as a visible message in chat
      const errorMsg = {
        id: `error_${Date.now()}`,
        role: 'system',
        content: errorMessage,
        timestamp: new Date().toISOString(),
        isError: true,
      };

      setMessages(prev => {
        const updated = [...prev, errorMsg];
        saveChatHistory(updated);
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }, [messages, saveChatHistory]);

  /**
   * Clear all chat history.
   */
  const clearChat = useCallback(async () => {
    setMessages([]);
    setError(null);
    try {
      await AsyncStorage.removeItem(CHAT_STORAGE_KEY);
    } catch (e) {
      console.log('[useAI] Error clearing history:', e.message);
    }
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearChat,
    loadChatHistory,
  };
}
