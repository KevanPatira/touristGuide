// screens/VoiceTranslatorScreen.js
// Bidirectional voice-to-voice translator with real STT, translation, and TTS.
//
// STT Strategy:
//   1. Try expo-speech-recognition (requires development build)
//   2. Fallback: TextInput where user can type or use Google Keyboard's mic button
//
// Works in both Expo Go (text input fallback) and development builds (full voice).

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Linking,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Hooks
import useTranslation from '../hooks/useTranslation';
import useTTS from '../hooks/useTTS';

// Sub-components
import LanguageSelector from './voiceTranslator/LanguageSelector';
import TranslationBubble from './voiceTranslator/TranslationBubble';
import MicButton from './voiceTranslator/MicButton';
import WaveformAnimation from './voiceTranslator/WaveformAnimation';

// Constants
import {
  DEFAULT_SOURCE_LANG,
  DEFAULT_TARGET_LANG,
  getLangByCode,
  getShortCode,
} from './voiceTranslator/translatorConstants';

const LANG_STORAGE_KEY = 'translator_lang_pair';
const MAX_HISTORY = 50;

// Source languages that support auto-detection
const DETECTION_LANGUAGES = ['en-US', 'hi-IN', 'kn-IN'];

// ─── Dynamically check if native speech recognition is available ───
let SpeechModule = null;
let useSpeechEvent = null;
let speechAvailable = false;

try {
  const speechPkg = require('expo-speech-recognition');
  SpeechModule = speechPkg.ExpoSpeechRecognitionModule;
  useSpeechEvent = speechPkg.useSpeechRecognitionEvent;
  // Check if the native module is actually loaded (won't be in Expo Go)
  if (SpeechModule && typeof SpeechModule.isRecognitionAvailable === 'function') {
    speechAvailable = true;
  }
} catch (e) {
  // expo-speech-recognition not installed or native module not available
  speechAvailable = false;
}

// Generate simple unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

// ─── Wrapper component that conditionally uses speech hooks ───
// We need this because React hooks (useSpeechRecognitionEvent) can't be conditional
function SpeechEventListener({ eventName, handler }) {
  // This component only renders when speechAvailable is true
  useSpeechEvent(eventName, handler);
  return null;
}

export default function VoiceTranslatorScreen() {
  // ─── Language state ───
  const [sourceLang, setSourceLang] = useState(DEFAULT_SOURCE_LANG);
  const [targetLang, setTargetLang] = useState(DEFAULT_TARGET_LANG);

  // ─── Conversation history ───
  const [history, setHistory] = useState([]);

  // ─── UI state ───
  const [errorBanner, setErrorBanner] = useState(null);
  const [inlineError, setInlineError] = useState(null);

  // ─── Voice STT state ───
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [partialTranscript, setPartialTranscript] = useState('');

  // ─── Text input fallback state ───
  const [textInput, setTextInput] = useState('');
  const textInputRef = useRef(null);

  // ─── Detected language from speech recognition ───
  const detectedLangRef = useRef(null);

  // ─── Check if native voice is truly available at runtime ───
  const [voiceAvailable, setVoiceAvailable] = useState(false);

  useEffect(() => {
    if (speechAvailable && SpeechModule) {
      try {
        const available = SpeechModule.isRecognitionAvailable();
        setVoiceAvailable(available);
      } catch (e) {
        setVoiceAvailable(false);
      }
    }
  }, []);

  // ─── Hooks ───
  const {
    translatedText,
    isTranslating,
    translationError,
    translate,
  } = useTranslation();

  const { isSpeaking, speak, stop: stopTTS } = useTTS();

  // ─── Refs ───
  const flatListRef = useRef(null);
  const pendingTranslationRef = useRef(null);
  const inlineErrorTimerRef = useRef(null);

  // For tracking which bubble TTS is playing on
  const [speakingBubbleId, setSpeakingBubbleId] = useState(null);

  // ─── Persistence: Load saved language pair on mount ───
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LANG_STORAGE_KEY);
        if (saved) {
          const { source, target } = JSON.parse(saved);
          if (source) setSourceLang(source);
          if (target) setTargetLang(target);
        }
      } catch {}
    })();
  }, []);

  // ─── Persistence: Save language pair on every change ───
  useEffect(() => {
    AsyncStorage.setItem(
      LANG_STORAGE_KEY,
      JSON.stringify({ source: sourceLang, target: targetLang })
    ).catch(() => {});
  }, [sourceLang, targetLang]);

  // ─── Handle Text Translation ───
  const handleTranslateText = useCallback(
    (textToTranslate, overrideSourceLang) => {
      if (!textToTranslate || textToTranslate.trim().length < 1) return;

      // Use detected language if available, otherwise fall back to selected source
      const effectiveSource = overrideSourceLang || sourceLang;
      const sourceShort = getShortCode(effectiveSource);
      const targetShort = getShortCode(targetLang);

      // Create a pending entry in history immediately
      const entryId = generateId();
      const newEntry = {
        id: entryId,
        originalText: textToTranslate.trim(),
        translatedText: null,
        sourceLang: effectiveSource,
        targetLang: targetLang,
        confidence: 1.0,
        timestamp: new Date(),
        error: null,
      };

      setHistory((prev) => {
        const updated = [...prev, newEntry];
        return updated.slice(-MAX_HISTORY);
      });

      pendingTranslationRef.current = entryId;

      // Fire translation
      translate(textToTranslate.trim(), sourceShort, targetShort)
        .then((result) => {
          if (result) {
            // Update the history entry with translated text
            setHistory((prev) =>
              prev.map((h) =>
                h.id === entryId ? { ...h, translatedText: result } : h
              )
            );

            // Auto-play TTS
            const targetLangData = getLangByCode(targetLang);
            if (targetLangData?.ttsLang) {
              setTimeout(() => {
                setSpeakingBubbleId(entryId);
                speak(result, targetLangData.ttsLang);
              }, 300);
            }
          }
        })
        .catch(() => {
          // Mark entry as failed
          setHistory((prev) =>
            prev.map((h) =>
              h.id === entryId
                ? { ...h, error: 'Translation failed. Tap to retry.' }
                : h
            )
          );
        });
    },
    [sourceLang, targetLang, translate, speak]
  );

  // ─── Speech event handlers (used by SpeechEventListener children) ───
  const onSpeechStart = useCallback(() => {
    setIsListening(true);
  }, []);

  const onSpeechEnd = useCallback(() => {
    setIsListening(false);
  }, []);

  const onSpeechResult = useCallback((event) => {
    if (event.results && event.results.length > 0) {
      const bestResult = event.results[0];
      const text = bestResult.transcript || '';

      if (event.isFinal) {
        setTranscript(text);
        setPartialTranscript('');
        if (text.trim().length > 1) {
          const detectedSource = detectedLangRef.current || null;
          handleTranslateText(text.trim(), detectedSource);
          detectedLangRef.current = null;
        }
      } else {
        setPartialTranscript(text);
      }
    }
  }, [handleTranslateText]);

  const onSpeechError = useCallback((event) => {
    setIsListening(false);
    setPartialTranscript('');
    const errorCode = event.error || 'unknown';
    console.warn('Speech recognition error:', errorCode, event.message);

    if (errorCode === 'not-allowed') {
      setErrorBanner('Microphone access is required. Please enable it in Settings.');
    } else if (errorCode === 'no-speech' || errorCode === 'speech-timeout') {
      showInlineError("We couldn't hear anything. Please try again.");
    } else if (errorCode === 'network') {
      showInlineError('No internet connection. Translation unavailable.');
    } else if (errorCode === 'service-not-allowed' || errorCode === 'language-not-supported') {
      showInlineError('Speech recognition is not available on this device.');
    } else if (errorCode === 'busy') {
      showInlineError('Speech recognizer is busy. Please wait and try again.');
    } else if (errorCode === 'aborted') {
      // User cancelled — no error to show
    } else {
      showInlineError('Something went wrong. Please try again.');
    }
  }, []);

  const onLanguageDetection = useCallback((event) => {
    if (event.detectedLanguage && event.confidence > 0.3) {
      detectedLangRef.current = event.detectedLanguage;
    }
  }, []);

  // ─── Handle translation errors for pending entries ───
  useEffect(() => {
    if (!translationError || !pendingTranslationRef.current) return;

    const entryId = pendingTranslationRef.current;
    const errorMsg =
      translationError === 'NETWORK_ERROR'
        ? 'No internet connection. Tap to retry.'
        : 'Translation failed. Tap to retry.';

    setHistory((prev) =>
      prev.map((h) =>
        h.id === entryId ? { ...h, error: errorMsg } : h
      )
    );
  }, [translationError]);

  // ─── Clear speaking bubble when TTS finishes ───
  useEffect(() => {
    if (!isSpeaking) {
      setSpeakingBubbleId(null);
    }
  }, [isSpeaking]);

  // ─── Auto-scroll to bottom when history changes ───
  useEffect(() => {
    if (history.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [history.length]);

  // ─── Show inline error with auto-dismiss ───
  const showInlineError = useCallback((message) => {
    setInlineError(message);
    if (inlineErrorTimerRef.current) {
      clearTimeout(inlineErrorTimerRef.current);
    }
    inlineErrorTimerRef.current = setTimeout(() => {
      setInlineError(null);
    }, 3000);
  }, []);

  // ─── Swap languages ───
  const handleSwap = useCallback(() => {
    setSourceLang((prev) => {
      setTargetLang(prev);
      return targetLang;
    });
  }, [targetLang]);

  // ─── Mic button handlers ───
  const handleMicPressIn = useCallback(async () => {
    if (voiceAvailable && SpeechModule) {
      // ── Native speech recognition path ──
      try {
        const { granted } = await SpeechModule.requestPermissionsAsync();
        if (!granted) {
          setErrorBanner('Microphone access is required. Please enable it in Settings.');
          return;
        }

        setTranscript('');
        setPartialTranscript('');
        detectedLangRef.current = null;

        const startOptions = {
          lang: sourceLang,
          interimResults: true,
          ...(Platform.OS === 'android' && {
            androidIntentOptions: {
              EXTRA_ENABLE_LANGUAGE_DETECTION: true,
              EXTRA_LANGUAGE_DETECTION_ALLOWED_LANGUAGES: DETECTION_LANGUAGES,
            },
          }),
        };

        SpeechModule.start(startOptions);
      } catch (e) {
        console.warn('SpeechModule.start error:', e);
        showInlineError('Could not start voice recognition.');
      }
    } else {
      // ── Fallback: focus the text input and show keyboard with mic ──
      if (textInputRef.current) {
        textInputRef.current.focus();
      }
    }
  }, [voiceAvailable, sourceLang, showInlineError]);

  const handleMicPressOut = useCallback(async () => {
    if (voiceAvailable && SpeechModule) {
      try {
        SpeechModule.stop();
      } catch (e) {
        console.warn('SpeechModule.stop error:', e);
      }
    }
    // For text fallback, nothing to do on release
  }, [voiceAvailable]);

  // ─── Text input submit handler ───
  const handleTextSubmit = useCallback(() => {
    if (textInput.trim().length > 0) {
      handleTranslateText(textInput.trim());
      setTextInput('');
      Keyboard.dismiss();
    }
  }, [textInput, handleTranslateText]);

  // ─── TTS replay for a history bubble ───
  const handleSpeak = useCallback(
    (text, langCode, bubbleId) => {
      const langData = getLangByCode(langCode);
      if (langData?.ttsLang) {
        setSpeakingBubbleId(bubbleId);
        speak(text, langData.ttsLang);
      }
    },
    [speak]
  );

  // ─── Retry a failed translation ───
  const handleRetry = useCallback(
    async (entryId) => {
      const entry = history.find((h) => h.id === entryId);
      if (!entry) return;

      // Clear the error
      setHistory((prev) =>
        prev.map((h) =>
          h.id === entryId ? { ...h, error: null, translatedText: null } : h
        )
      );

      const sourceShort = getShortCode(entry.sourceLang);
      const targetShort = getShortCode(entry.targetLang);

      try {
        const result = await translate(
          entry.originalText,
          sourceShort,
          targetShort
        );
        if (result) {
          setHistory((prev) =>
            prev.map((h) =>
              h.id === entryId ? { ...h, translatedText: result, error: null } : h
            )
          );
        }
      } catch {
        setHistory((prev) =>
          prev.map((h) =>
            h.id === entryId
              ? { ...h, error: 'Translation failed. Tap to retry.' }
              : h
          )
        );
      }
    },
    [history, translate]
  );

  // ─── Clear history ───
  const handleClearHistory = useCallback(() => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all translation history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => setHistory([]),
        },
      ]
    );
  }, []);

  // ─── Render conversation bubble ───
  const renderBubble = useCallback(
    ({ item }) => (
      <TranslationBubble
        entry={item}
        onSpeak={(text, langCode) => handleSpeak(text, langCode, item.id)}
        onRetry={() => handleRetry(item.id)}
        isSpeakingThis={speakingBubbleId === item.id}
      />
    ),
    [handleSpeak, handleRetry, speakingBubbleId]
  );

  const keyExtractor = useCallback((item) => item.id, []);

  // ─── Source language label for listening indicator ───
  const sourceLabel = useMemo(() => getLangByCode(sourceLang).name, [sourceLang]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Speech event listeners (only rendered when native voice is available) ── */}
      {voiceAvailable && useSpeechEvent && (
        <>
          <SpeechEventListener eventName="start" handler={onSpeechStart} />
          <SpeechEventListener eventName="end" handler={onSpeechEnd} />
          <SpeechEventListener eventName="result" handler={onSpeechResult} />
          <SpeechEventListener eventName="error" handler={onSpeechError} />
          <SpeechEventListener eventName="languagedetection" handler={onLanguageDetection} />
        </>
      )}

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>🌐 Voice Translator</Text>
          {history.length > 0 && (
            <TouchableOpacity
              onPress={handleClearHistory}
              style={styles.clearButton}
            >
              <Ionicons name="trash-outline" size={18} color="#b0b4c3" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.subtitle}>
          {voiceAvailable
            ? 'Speak naturally, hear the translation instantly'
            : 'Type or use your keyboard\'s mic to translate'}
        </Text>
      </View>

      {/* ── Mic Denied Banner ── */}
      {errorBanner && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning" size={18} color="#ff4444" />
          <Text style={styles.errorBannerText}>{errorBanner}</Text>
          <TouchableOpacity
            onPress={() => Linking.openSettings()}
            style={styles.settingsButton}
          >
            <Text style={styles.settingsButtonText}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Language Selector ── */}
      <LanguageSelector
        sourceLang={sourceLang}
        targetLang={targetLang}
        onSourceChange={setSourceLang}
        onTargetChange={setTargetLang}
        onSwap={handleSwap}
      />

      {/* ── Conversation History ── */}
      <FlatList
        ref={flatListRef}
        data={history}
        renderItem={renderBubble}
        keyExtractor={keyExtractor}
        style={styles.historyList}
        contentContainerStyle={
          history.length === 0
            ? styles.emptyListContent
            : styles.historyListContent
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="chatbubbles-outline"
              size={64}
              color="#252a3f"
            />
            <Text style={styles.emptyText}>
              Your translations will appear here
            </Text>
            <Text style={styles.emptySubtext}>
              {voiceAvailable
                ? 'Hold the mic button and speak to translate'
                : 'Type a phrase below or tap the mic to use voice keyboard'}
            </Text>
            {voiceAvailable && (
              <View style={{ marginTop: 28 }}>
                <MicButton
                  isListening={isListening}
                  onPressIn={handleMicPressIn}
                  onPressOut={handleMicPressOut}
                  disabled={isTranslating}
                />
              </View>
            )}
          </View>
        }
      />

      {/* ── Waveform + Listening Indicator ── */}
      {isListening && (
        <View style={styles.listeningSection}>
          <WaveformAnimation isActive={isListening} />
          <Text style={styles.listeningText}>
            Listening in {sourceLabel}...
          </Text>
          {partialTranscript ? (
            <Text style={styles.partialTranscript} numberOfLines={2}>
              "{partialTranscript}"
            </Text>
          ) : null}
        </View>
      )}

      {/* ── Translating Indicator ── */}
      {isTranslating && !isListening && (
        <View style={styles.translatingSection}>
          <Text style={styles.translatingText}>Translating...</Text>
        </View>
      )}

      {/* ── Inline Error ── */}
      {inlineError && (
        <View style={styles.inlineError}>
          <Ionicons name="information-circle" size={16} color="#ff9944" />
          <Text style={styles.inlineErrorText}>{inlineError}</Text>
        </View>
      )}

      {/* ── Input Section ── */}
      <View style={styles.inputSection}>
        {voiceAvailable ? (
          // Native voice available: show mic button
          history.length > 0 && (
            <MicButton
              isListening={isListening}
              onPressIn={handleMicPressIn}
              onPressOut={handleMicPressOut}
              disabled={isTranslating}
            />
          )
        ) : (
          // Fallback: text input with send button and mic hint
          <View style={styles.textInputRow}>
            <TextInput
              ref={textInputRef}
              style={styles.textInput}
              placeholder="Type or tap 🎤 on keyboard..."
              placeholderTextColor="#666"
              value={textInput}
              onChangeText={setTextInput}
              onSubmitEditing={handleTextSubmit}
              returnKeyType="send"
              multiline={false}
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                textInput.trim().length === 0 && styles.sendButtonDisabled,
              ]}
              onPress={handleTextSubmit}
              disabled={textInput.trim().length === 0 || isTranslating}
            >
              <Ionicons
                name="send"
                size={20}
                color={textInput.trim().length > 0 ? '#FFFFFF' : '#555'}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050b18',
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: '#b0b4c3',
    fontSize: 13,
    marginTop: 4,
  },
  clearButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#161b2b',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Error banner (mic denied)
  errorBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#2a1015',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#ff444433',
  },
  errorBannerText: {
    color: '#ff8888',
    fontSize: 12,
    flex: 1,
  },
  settingsButton: {
    backgroundColor: '#ff444433',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  settingsButtonText: {
    color: '#ff8888',
    fontSize: 11,
    fontWeight: '600',
  },

  // History list
  historyList: {
    flex: 1,
  },
  historyListContent: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    color: '#b0b4c3',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#666',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },

  // Listening section
  listeningSection: {
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#0d1322',
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 4,
  },
  listeningText: {
    color: '#ff7a45',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  partialTranscript: {
    color: '#b0b4c3',
    fontSize: 13,
    marginTop: 4,
    fontStyle: 'italic',
    paddingHorizontal: 16,
    textAlign: 'center',
  },

  // Translating section
  translatingSection: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  translatingText: {
    color: '#ff7a45',
    fontSize: 13,
    fontWeight: '500',
  },

  // Inline error
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  inlineErrorText: {
    color: '#ff9944',
    fontSize: 13,
  },

  // Input section
  inputSection: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    paddingTop: 8,
    alignItems: 'center',
  },

  // Text input fallback
  textInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#161b2b',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
    color: '#ffffff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#252a3f',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ff7a45',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff7a45',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#252a3f',
    shadowOpacity: 0,
    elevation: 0,
  },
});
