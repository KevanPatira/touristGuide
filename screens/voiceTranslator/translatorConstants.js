// voiceTranslator/translatorConstants.js
// Supported languages with BCP-47 codes, display names, native names, and flag emojis

export const SUPPORTED_LANGUAGES = [
  { code: 'en-US', shortCode: 'en', name: 'English',    native: 'English',    flag: '🇺🇸', ttsLang: 'en-US' },
  { code: 'hi-IN', shortCode: 'hi', name: 'Hindi',      native: 'हिंदी',       flag: '🇮🇳', ttsLang: 'hi-IN' },
  { code: 'es-ES', shortCode: 'es', name: 'Spanish',    native: 'Español',    flag: '🇪🇸', ttsLang: 'es-ES' },
  { code: 'fr-FR', shortCode: 'fr', name: 'French',     native: 'Français',   flag: '🇫🇷', ttsLang: 'fr-FR' },
  { code: 'de-DE', shortCode: 'de', name: 'German',     native: 'Deutsch',    flag: '🇩🇪', ttsLang: 'de-DE' },
  { code: 'ja-JP', shortCode: 'ja', name: 'Japanese',   native: '日本語',      flag: '🇯🇵', ttsLang: 'ja-JP' },
  { code: 'ar-SA', shortCode: 'ar', name: 'Arabic',     native: 'العربية',     flag: '🇸🇦', ttsLang: 'ar-SA' },
  { code: 'zh-CN', shortCode: 'zh', name: 'Mandarin',   native: '中文',        flag: '🇨🇳', ttsLang: 'zh-CN' },
  { code: 'pt-BR', shortCode: 'pt', name: 'Portuguese', native: 'Português',  flag: '🇧🇷', ttsLang: 'pt-BR' },
  { code: 'it-IT', shortCode: 'it', name: 'Italian',    native: 'Italiano',   flag: '🇮🇹', ttsLang: 'it-IT' },
  { code: 'ta-IN', shortCode: 'ta', name: 'Tamil',      native: 'தமிழ்',       flag: '🇮🇳', ttsLang: 'ta-IN' },
  { code: 'kn-IN', shortCode: 'kn', name: 'Kannada',    native: 'ಕನ್ನಡ',       flag: '🇮🇳', ttsLang: 'kn-IN' },
];

// Helper: get language object by BCP-47 code
export function getLangByCode(code) {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code) || SUPPORTED_LANGUAGES[0];
}

// Helper: get short code (e.g. 'en' from 'en-US') for translation API
export function getShortCode(bcp47Code) {
  const lang = getLangByCode(bcp47Code);
  return lang ? lang.shortCode : bcp47Code.split('-')[0];
}

// Default language pair
export const DEFAULT_SOURCE_LANG = 'en-US';
export const DEFAULT_TARGET_LANG = 'hi-IN';

// Storage keys
export const STORAGE_KEYS = {
  SOURCE_LANG: '@voiceTranslator_sourceLang',
  TARGET_LANG: '@voiceTranslator_targetLang',
};
