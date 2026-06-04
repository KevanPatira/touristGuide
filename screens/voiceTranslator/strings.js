// voiceTranslator/strings.js
// All user-facing strings in one place for future i18n support

const STRINGS = {
  // Header
  SCREEN_TITLE: 'Voice Translator',
  SCREEN_SUBTITLE: 'Speak naturally, hear the translation instantly',

  // Language selector
  SOURCE_LABEL: 'From',
  TARGET_LABEL: 'To',
  SWAP_LABEL: 'Swap languages',

  // Mic states
  TAP_TO_SPEAK: 'Tap to speak',
  LISTENING: 'Listening…',
  START_RECORDING: 'Start recording',
  STOP_RECORDING: 'Stop recording',

  // Processing
  TRANSLATING: 'Translating…',

  // Errors
  MIC_DENIED: 'Microphone access denied. Please enable it in your device settings.',
  NO_SPEECH: "We couldn't hear anything. Please try again.",
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  EMPTY_TRANSCRIPT: 'Nothing was captured. Please speak clearly.',
  OFFLINE_BANNER: "You're offline. Translation requires an internet connection.",
  TRANSLATION_FAILED: 'Translation failed. Tap to retry.',
  LOW_CONFIDENCE: 'Low confidence — tap to retry',
  VOICE_NOT_SUPPORTED: 'Voice input requires a custom development build. Expo Go does not support this feature.',
  TYPE_FALLBACK_PLACEHOLDER: 'Type a phrase to translate…',
  VOICE_UNAVAILABLE_BANNER: 'Voice unavailable in Expo Go — type to translate instead',

  // History
  CLEAR_HISTORY: 'Clear History',
  CLEAR_HISTORY_CONFIRM: 'Are you sure you want to clear all translation history?',
  CLEAR_CONFIRM_YES: 'Clear',
  CLEAR_CONFIRM_NO: 'Cancel',
  NO_HISTORY: 'Your translations will appear here',

  // TTS
  SPEAK_TRANSLATION: 'Play translation',
  SPEAKING: 'Speaking…',
};

export default STRINGS;
