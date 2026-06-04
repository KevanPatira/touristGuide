// hooks/useVoiceRecognition.js
// Custom hook encapsulating all Speech-to-Text logic.
// Uses @react-native-voice/voice (requires a custom dev build — NOT Expo Go).
// If the native module is unavailable, voice features are gracefully disabled.

import { useState, useEffect, useCallback, useRef } from 'react';
import { NativeModules } from 'react-native';

// ─── Guarded import: @react-native-voice/voice requires native modules ───
let Voice = null;
let _nativeVoiceAvailable = false;

try {
  Voice = require('@react-native-voice/voice').default;
  // Verify that the actual native module exists (Voice on Android, RCTVoice on iOS)
  if (Voice && typeof Voice.start === 'function' && (NativeModules.Voice || NativeModules.RCTVoice)) {
    _nativeVoiceAvailable = true;
  }
} catch (e) {
  console.warn(
    '@react-native-voice/voice not available. ' +
    'Voice input disabled — use a custom development build for STT support.'
  );
}

export default function useVoiceRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [partialTranscript, setPartialTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState(null);

  const isListeningRef = useRef(false);

  // Keep ref in sync
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // ─── Register Voice event handlers & cleanup ───
  useEffect(() => {
    if (!Voice || !_nativeVoiceAvailable) return;

    // Partial results (live transcript while speaking)
    Voice.onSpeechPartialResults = (e) => {
      if (e.value && e.value.length > 0) {
        setPartialTranscript(e.value[0]);
      }
    };

    // Final results
    Voice.onSpeechResults = (e) => {
      if (e.value && e.value.length > 0) {
        setTranscript(e.value[0]);
        setPartialTranscript('');
        // Confidence is not always provided by all engines;
        // default to 0.95 if unavailable
        setConfidence(0.95);
      }
    };

    // Speech recognition ended
    Voice.onSpeechEnd = () => {
      setIsListening(false);
    };

    // Error handling
    Voice.onSpeechError = (e) => {
      setIsListening(false);
      setPartialTranscript('');

      const errorCode = e.error?.code || e.error?.message || String(e.error);

      // Error code "7" = no match / low confidence
      if (errorCode === '7' || errorCode === 'recognition_fail') {
        setError('LOW_CONFIDENCE');
      } else if (errorCode === '5' || errorCode === 'server') {
        setError('NETWORK_ERROR');
      } else if (errorCode === '9' || errorCode === 'insufficient_permissions') {
        setError('MIC_DENIED');
      } else if (errorCode === '6' || errorCode === 'no_speech' || errorCode === 'speech_timeout') {
        setError('NO_SPEECH');
      } else {
        setError('UNKNOWN_ERROR');
      }
    };

    // Cleanup: destroy Voice instance on unmount
    return () => {
      if (Voice && _nativeVoiceAvailable) {
        Voice.destroy().then(() => {
          Voice.removeAllListeners();
        }).catch(() => {});
      }
    };
  }, []);

  // ─── Start Listening ───
  const startListening = useCallback(async (localeCode = 'en-US') => {
    // Guard: check if native module is available
    if (!Voice || !_nativeVoiceAvailable) {
      setError('VOICE_NOT_SUPPORTED');
      return;
    }

    // Guard: don't start if already listening
    if (isListeningRef.current) {
      return;
    }

    setError(null);
    setTranscript('');
    setPartialTranscript('');
    setConfidence(0);

    try {
      setIsListening(true);
      // Pass the locale code directly so the STT engine
      // uses the correct language model
      await Voice.start(localeCode);
    } catch (err) {
      console.error('Failed to start Voice recognition:', err);
      setIsListening(false);
      
      // Fallback if the native module check was bypassed somehow
      if (err instanceof TypeError && err.message.includes('startSpeech')) {
        setError('VOICE_NOT_SUPPORTED');
      } else {
        setError('UNKNOWN_ERROR');
      }
    }
  }, []);

  // ─── Stop Listening ───
  const stopListening = useCallback(async () => {
    if (!Voice || !_nativeVoiceAvailable) return;

    try {
      await Voice.stop();
    } catch (err) {
      console.error('Failed to stop Voice recognition:', err);
    }
    setIsListening(false);
  }, []);

  // ─── Reset Transcript ───
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setPartialTranscript('');
    setConfidence(0);
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    partialTranscript,
    confidence,
    error,
    isNativeAvailable: _nativeVoiceAvailable,
    startListening,
    stopListening,
    resetTranscript,
  };
}
