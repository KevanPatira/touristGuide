// hooks/useTTS.js
// Custom hook for Text-to-Speech playback using expo-speech.

import { useState, useCallback } from 'react';
import * as Speech from 'expo-speech';

export default function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback((text, lang) => {
    // Guard: do not speak empty text
    if (!text || text.trim().length === 0) return;

    // Stop any ongoing speech first
    Speech.stop();

    setIsSpeaking(true);

    Speech.speak(text, {
      language: lang,
      onDone: () => {
        setIsSpeaking(false);
      },
      onError: () => {
        setIsSpeaking(false);
      },
      onStopped: () => {
        setIsSpeaking(false);
      },
    });
  }, []);

  const stop = useCallback(() => {
    Speech.stop();
    setIsSpeaking(false);
  }, []);

  return {
    isSpeaking,
    speak,
    stop,
  };
}
