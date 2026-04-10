// screens/ImageTranslatorScreen.js — Google Gemini Vision OCR + Translation
// ────────────────────────────────────────────────────────────────────
// NEW PACKAGES TO INSTALL (if not already present):
//   npx expo install expo-clipboard expo-haptics
// ────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  TextInput,
  Modal,
  FlatList,
  Animated,
  Dimensions,
  Share,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// ── Optional packages (graceful fallback if not installed) ──────────
let Clipboard = null;
try { Clipboard = require('expo-clipboard'); } catch (e) { /* not installed */ }

let Haptics = null;
try { Haptics = require('expo-haptics'); } catch (e) { /* not installed */ }

// ── Constants ──────────────────────────────────────────────────────
const { width: SCREEN_W } = Dimensions.get('window');

const GEMINI_API_KEY =
  process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

const STORAGE_KEYS = {
  DEFAULT_LANGUAGE: '@img_translator_default_lang',
  HISTORY: '@img_translator_history',
};

const MAX_HISTORY = 20;

/** Languages relevant to tourists worldwide */
const LANGUAGES = [
  'English', 'French', 'Spanish', 'German', 'Italian',
  'Japanese', 'Chinese Simplified', 'Chinese Traditional', 'Korean', 'Arabic',
  'Hindi', 'Portuguese', 'Russian', 'Thai', 'Vietnamese',
  'Indonesian', 'Malay', 'Turkish', 'Dutch', 'Swedish',
  'Polish', 'Greek', 'Hebrew', 'Czech', 'Romanian',
  'Hungarian', 'Danish', 'Finnish', 'Norwegian', 'Ukrainian',
  'Bengali', 'Tamil', 'Swahili', 'Persian', 'Filipino',
];

// ── Design Tokens (match project theme) ────────────────────────────
const COLORS = {
  bg: '#050b18',
  card: '#161b2b',
  cardAlt: '#1a2240',
  accent: '#ff7a45',
  accentSoft: '#ff7a4522',
  green: '#4CAF50',
  greenSoft: '#4CAF5022',
  blue: '#2196F3',
  blueSoft: '#2196F322',
  red: '#ff4444',
  redSoft: '#ff444422',
  purple: '#8A2BE2',
  purpleSoft: '#8A2BE222',
  text: '#ffffff',
  textMuted: '#b0b4c3',
  textDim: '#666',
  border: '#252a3f',
  inputBg: '#1f2740',
};

// ══════════════════════════════════════════════════════════════════════
//  HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════════════

/**
 * Convert an image URI to a base64 string using expo-file-system.
 * @param {string} uri - The local URI of the image.
 * @returns {Promise<string>} The base64-encoded image data.
 */
const uriToBase64 = async (uri) => {
  return FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
};

/**
 * Detect the MIME type from a URI or default to image/jpeg.
 * @param {string} uri - The file URI.
 * @returns {string} A MIME type string like "image/jpeg".
 */
const detectMediaType = (uri) => {
  const lower = (uri || '').toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
};

/**
 * Fire a light haptic impact if expo-haptics is available.
 */
const triggerHaptic = async () => {
  try {
    if (Haptics) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch (_) { /* ignore */ }
};

/**
 * Copy text to clipboard with haptic feedback.
 * @param {string} text - Text to copy.
 */
const copyToClipboard = async (text) => {
  try {
    if (Clipboard && Clipboard.setStringAsync) {
      await Clipboard.setStringAsync(text);
    } else if (Clipboard && Clipboard.setString) {
      Clipboard.setString(text);
    } else {
      // Fallback: alert the text so user can copy manually
      Alert.alert('Copied!', text);
      return;
    }
    await triggerHaptic();
    Alert.alert('✅ Copied!', 'Translation copied to clipboard.');
  } catch (e) {
    Alert.alert('Error', 'Could not copy text.');
  }
};

/**
 * Share text using the native share sheet.
 * @param {string} text - Text to share.
 * @param {string} title - Title for the share dialog.
 */
const shareText = async (text, title = 'Translation') => {
  try {
    await triggerHaptic();
    await Share.share({ message: text, title });
  } catch (_) { /* user cancelled */ }
};

// ══════════════════════════════════════════════════════════════════════
//  GOOGLE GEMINI API CALLS (Free Tier)
// ══════════════════════════════════════════════════════════════════════

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Fetch with automatic retry on 429 (rate limit) errors.
 * Uses exponential backoff: 2s → 4s → 8s.
 * @param {string} url - Request URL.
 * @param {object} options - Fetch options.
 * @param {number} maxRetries - Maximum retry attempts.
 * @returns {Promise<Response>}
 */
const fetchWithRetry = async (url, options, maxRetries = 3) => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);
    if (response.status === 429 && attempt < maxRetries) {
      const delay = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s
      console.log(`Rate limited (429). Retrying in ${delay / 1000}s... (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }
    return response;
  }
};

/**
 * Send an image to Gemini Vision API to extract text and detect language.
 * @param {string} base64Data - Base64-encoded image data.
 * @param {string} mediaType - MIME type of the image.
 * @returns {Promise<{extractedText: string, detectedLanguage: string}>}
 */
const extractTextFromImage = async (base64Data, mediaType) => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured. Set EXPO_PUBLIC_GEMINI_API_KEY in your .env file.');
  }

  const response = await fetchWithRetry(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          {
            inline_data: {
              mime_type: mediaType,
              data: base64Data,
            },
          },
          {
            text: `Extract ALL text visible in this image exactly as it appears, preserving layout and structure as much as possible. Then detect the language of the text. Return a JSON object with keys: "extractedText" (string — the full extracted text), "detectedLanguage" (string — full language name, e.g. "Japanese", "French"). If no text is found return {"extractedText":"","detectedLanguage":"Unknown"}. Return ONLY the raw JSON, no markdown fences, no extra text.`,
          },
        ],
      }],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`API error ${response.status}: ${errBody}`);
  }

  const result = await response.json();
  const raw = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Try to parse JSON from the response
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { extractedText: raw, detectedLanguage: 'Unknown' };
  }
};

/**
 * Translate text to a target language using Gemini.
 * @param {string} text - Source text to translate.
 * @param {string} sourceLang - Detected source language name.
 * @param {string} targetLang - Target language name.
 * @returns {Promise<string>} The translated text.
 */
const translateText = async (text, sourceLang, targetLang) => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured.');
  }

  if (sourceLang.toLowerCase() === targetLang.toLowerCase()) {
    return text;
  }

  const response = await fetchWithRetry(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Translate the following ${sourceLang} text into ${targetLang}. Return ONLY the translated text, nothing else.\n\n${text}`,
        }],
      }],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Translation API error ${response.status}: ${errBody}`);
  }

  const result = await response.json();
  return result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
};

// ══════════════════════════════════════════════════════════════════════
//  SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════════════

/** Animated skeleton loader placeholder */
function SkeletonBlock({ width = '100%', height = 16, style }) {
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[
        { width, height, backgroundColor: COLORS.inputBg, borderRadius: 8, opacity: anim },
        style,
      ]}
    />
  );
}

/** Processing skeleton card shown while OCR is running */
function ProcessingCard({ index, total }) {
  return (
    <View style={styles.resultCard}>
      <View style={styles.resultHeader}>
        <SkeletonBlock width={80} height={80} style={{ borderRadius: 12 }} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <SkeletonBlock width="60%" height={14} style={{ marginBottom: 8 }} />
          <SkeletonBlock width="40%" height={12} style={{ marginBottom: 8 }} />
          <SkeletonBlock width="80%" height={12} />
        </View>
      </View>
      <View style={styles.processingBanner}>
        <ActivityIndicator size="small" color={COLORS.accent} />
        <Text style={styles.processingText}>
          Processing image {index + 1} of {total}…
        </Text>
      </View>
      <SkeletonBlock width="100%" height={60} style={{ marginTop: 12, borderRadius: 12 }} />
      <SkeletonBlock width="100%" height={80} style={{ marginTop: 10, borderRadius: 12 }} />
    </View>
  );
}

/** Animated progress bar */
function ProgressBar({ current, total }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: total > 0 ? current / total : 0,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [current, total]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.progressBarContainer}>
      <View style={styles.progressBarTrack}>
        <Animated.View style={[styles.progressBarFill, { width }]} />
      </View>
      <Text style={styles.progressLabel}>{current}/{total}</Text>
    </View>
  );
}

/** Badge showing the detected source language */
function LanguageBadge({ language, color = COLORS.purple }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '22' }]}>
      <Ionicons name="language" size={12} color={color} />
      <Text style={[styles.badgeText, { color }]}>{language}</Text>
    </View>
  );
}

/** A single result card for one processed image */
function ResultCard({ item, onRetry }) {
  const [showOriginal, setShowOriginal] = useState(false);

  if (item.error) {
    return (
      <View style={[styles.resultCard, styles.errorCard]}>
        <View style={styles.resultHeader}>
          <Image source={{ uri: item.uri }} style={styles.thumbnail} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.errorTitle}>❌ Processing Failed</Text>
            <Text style={styles.errorMessage} numberOfLines={3}>{item.error}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.retryButton} onPress={() => onRetry(item)}>
          <Ionicons name="refresh" size={18} color={COLORS.text} />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!item.extractedText && !item.error) {
    return (
      <View style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <Image source={{ uri: item.uri }} style={styles.thumbnail} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.noTextTitle}>No Text Found</Text>
            <Text style={styles.noTextDesc}>
              Could not detect any text in this image. Try a clearer photo.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.resultCard}>
      {/* Header: thumbnail + language badge */}
      <View style={styles.resultHeader}>
        <Image source={{ uri: item.uri }} style={styles.thumbnail} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <LanguageBadge language={item.detectedLanguage} />
          <Text style={styles.resultTimestamp}>
            {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : ''}
          </Text>
        </View>
      </View>

      {/* Collapsible original text */}
      <TouchableOpacity
        style={styles.collapsibleHeader}
        onPress={() => setShowOriginal(!showOriginal)}
        activeOpacity={0.7}
      >
        <Text style={styles.collapsibleTitle}>Original Text</Text>
        <Ionicons
          name={showOriginal ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={COLORS.textMuted}
        />
      </TouchableOpacity>
      {showOriginal && (
        <View style={styles.originalTextBox}>
          <Text style={styles.originalText} selectable>{item.extractedText}</Text>
        </View>
      )}

      {/* Translated text — prominent */}
      <View style={styles.translatedBox}>
        <View style={styles.translatedHeader}>
          <Text style={styles.translatedLabel}>
            Translation ({item.targetLanguage})
          </Text>
          <LanguageBadge language={item.targetLanguage} color={COLORS.green} />
        </View>
        <Text style={styles.translatedText} selectable>
          {item.translatedText}
        </Text>
      </View>

      {/* Action buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: COLORS.blueSoft }]}
          onPress={() => copyToClipboard(item.translatedText)}
        >
          <Ionicons name="copy-outline" size={18} color={COLORS.blue} />
          <Text style={[styles.actionBtnText, { color: COLORS.blue }]}>Copy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: COLORS.greenSoft }]}
          onPress={() =>
            shareText(
              `[${item.detectedLanguage} → ${item.targetLanguage}]\n\n${item.translatedText}`,
              'Translation'
            )
          }
        >
          <Ionicons name="share-outline" size={18} color={COLORS.green} />
          <Text style={[styles.actionBtnText, { color: COLORS.green }]}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/** History item card */
function HistoryCard({ session, onPress }) {
  const date = new Date(session.timestamp);
  return (
    <TouchableOpacity style={styles.historyCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.historyRow}>
        {session.thumbnailUri ? (
          <Image source={{ uri: session.thumbnailUri }} style={styles.historyThumb} />
        ) : (
          <View style={[styles.historyThumb, { backgroundColor: COLORS.inputBg, justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="image-outline" size={20} color={COLORS.textDim} />
          </View>
        )}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <LanguageBadge language={session.sourceLang} />
            <Ionicons name="arrow-forward" size={12} color={COLORS.textDim} />
            <LanguageBadge language={session.targetLang} color={COLORS.green} />
          </View>
          <Text style={styles.historyPreview} numberOfLines={2}>
            {session.preview || 'No text'}
          </Text>
          <Text style={styles.historyDate}>
            {date.toLocaleDateString()} • {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textDim} />
      </View>
    </TouchableOpacity>
  );
}

/** Empty state when no images are loaded */
function EmptyState({ onCamera, onGallery }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="scan-outline" size={64} color={COLORS.accent} />
      </View>
      <Text style={styles.emptyTitle}>Translate Any Image</Text>
      <Text style={styles.emptyDesc}>
        Capture or select photos of signs, menus, documents — and get instant translations
        powered by AI.
      </Text>

      <TouchableOpacity style={styles.primaryBtn} onPress={onCamera} activeOpacity={0.8}>
        <Ionicons name="camera" size={22} color={COLORS.text} />
        <Text style={styles.primaryBtnText}>Take Photo</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryBtn} onPress={onGallery} activeOpacity={0.8}>
        <Ionicons name="images" size={22} color={COLORS.accent} />
        <Text style={styles.secondaryBtnText}>Choose from Gallery</Text>
      </TouchableOpacity>
    </View>
  );
}

/** Searchable language picker modal */
function LanguagePickerModal({ visible, onClose, selectedLanguage, onSelect }) {
  const [search, setSearch] = useState('');

  const filtered = LANGUAGES.filter((lang) =>
    lang.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.languageModal}>
          {/* Header */}
          <View style={styles.languageModalHeader}>
            <Text style={styles.languageModalTitle}>Target Language</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={COLORS.textDim} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search languages…"
              placeholderTextColor={COLORS.textDim}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close" size={18} color={COLORS.textDim} />
              </TouchableOpacity>
            )}
          </View>

          {/* Language list */}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const isSelected = item === selectedLanguage;
              return (
                <TouchableOpacity
                  style={[styles.langItem, isSelected && styles.langItemActive]}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <Text style={[styles.langItemText, isSelected && styles.langItemTextActive]}>
                    {item}
                  </Text>
                  {isSelected && <Ionicons name="checkmark-circle" size={20} color={COLORS.accent} />}
                </TouchableOpacity>
              );
            }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
              <Text style={styles.noResultsText}>No languages match "{search}"</Text>
            }
          />
        </View>
      </View>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════

export default function ImageTranslatorScreen({ navigation }) {
  // ── State ──────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('translate'); // 'translate' | 'history'
  const [targetLang, setTargetLang] = useState('English');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [results, setResults] = useState([]); // Array of result objects
  const [processing, setProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalImages, setTotalImages] = useState(0);
  const [history, setHistory] = useState([]);
  const [historyDetail, setHistoryDetail] = useState(null); // expanded history item
  const scrollRef = useRef(null);

  // ── Load persisted data on mount ──────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const savedLang = await AsyncStorage.getItem(STORAGE_KEYS.DEFAULT_LANGUAGE);
        if (savedLang) setTargetLang(savedLang);
        const savedHistory = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);
        if (savedHistory) setHistory(JSON.parse(savedHistory));
      } catch (_) { /* ignore */ }
    })();
  }, []);

  /**
   * Persist the selected default language.
   * @param {string} lang - Language name to save.
   */
  const setAndPersistLang = useCallback(async (lang) => {
    setTargetLang(lang);
    try { await AsyncStorage.setItem(STORAGE_KEYS.DEFAULT_LANGUAGE, lang); } catch (_) {}
  }, []);

  /**
   * Save a session to history (max 20 items).
   * @param {Array} resultItems - Array of result objects from a batch.
   */
  const saveToHistory = useCallback(async (resultItems) => {
    try {
      const validResults = resultItems.filter((r) => r.extractedText && !r.error);
      if (validResults.length === 0) return;

      const session = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        sourceLang: validResults[0]?.detectedLanguage || 'Unknown',
        targetLang: validResults[0]?.targetLanguage || targetLang,
        preview: validResults[0]?.translatedText?.substring(0, 100) || '',
        thumbnailUri: validResults[0]?.uri || null,
        results: validResults,
      };

      const updatedHistory = [session, ...history].slice(0, MAX_HISTORY);
      setHistory(updatedHistory);
      await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updatedHistory));
    } catch (_) { /* ignore */ }
  }, [history, targetLang]);

  // ── Image Picking ─────────────────────────────────────────────────

  /**
   * Launch camera, capture single image, then process it.
   */
  const pickFromCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera access is needed to capture photos for translation.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets?.length > 0) {
        processImages(result.assets);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open camera: ' + e.message);
    }
  };

  /**
   * Launch gallery, allow multi-image selection, then process them.
   */
  const pickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Gallery access is needed to select images for translation.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 10,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets?.length > 0) {
        processImages(result.assets);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open gallery: ' + e.message);
    }
  };

  // ── Batch Processing ──────────────────────────────────────────────

  /**
   * Process an array of image assets sequentially — OCR then translate.
   * Each result card appears as it completes.
   * @param {Array} assets - Array of expo-image-picker asset objects.
   */
  const processImages = async (assets) => {
    // Filter out any undefined/invalid assets
    const validAssets = assets.filter((a) => a && a.uri);
    if (validAssets.length === 0) {
      Alert.alert('Error', 'No valid images selected.');
      return;
    }

    setProcessing(true);
    setResults([]);
    setProcessedCount(0);
    setTotalImages(validAssets.length);
    setActiveTab('translate');

    const allResults = [];

    for (let i = 0; i < validAssets.length; i++) {
      const asset = validAssets[i];
      setProcessedCount(i);

      let resultItem = {
        id: `${Date.now()}_${i}`,
        uri: asset.uri,
        timestamp: Date.now(),
        targetLanguage: targetLang,
        extractedText: '',
        detectedLanguage: '',
        translatedText: '',
        error: null,
      };

      try {
        // Always read base64 from file system (multi-select doesn't return base64)
        const base64Data = await uriToBase64(asset.uri);
        if (!base64Data) throw new Error('Could not read image data.');

        const mediaType = detectMediaType(asset.uri);

        // Step 1: OCR
        const ocrResult = await extractTextFromImage(base64Data, mediaType);
        resultItem.extractedText = ocrResult.extractedText || '';
        resultItem.detectedLanguage = ocrResult.detectedLanguage || 'Unknown';

        if (!resultItem.extractedText) {
          // No text found — still show the card
          resultItem.extractedText = '';
        } else {
          // Step 2: Translate
          const translated = await translateText(
            resultItem.extractedText,
            resultItem.detectedLanguage,
            targetLang
          );
          resultItem.translatedText = translated;
        }
      } catch (err) {
        resultItem.error = err.message || 'Unknown error occurred.';
      }

      allResults.push(resultItem);
      setResults([...allResults]);
      setProcessedCount(i + 1);
    }

    setProcessing(false);
    // Save completed results to history
    await saveToHistory(allResults);
  };

  /**
   * Retry a single failed image.
   * @param {object} failedItem - The result object that failed.
   */
  const retryItem = useCallback(async (failedItem) => {
    const fakeAsset = { uri: failedItem.uri, base64: null };
    // Remove the failed item from results and re-process
    setResults((prev) => prev.filter((r) => r.id !== failedItem.id));
    setProcessing(true);
    setTotalImages(1);
    setProcessedCount(0);

    let resultItem = {
      id: `${Date.now()}_retry`,
      uri: failedItem.uri,
      timestamp: Date.now(),
      targetLanguage: targetLang,
      extractedText: '',
      detectedLanguage: '',
      translatedText: '',
      error: null,
    };

    try {
      const base64Data = await uriToBase64(failedItem.uri);
      const mediaType = detectMediaType(failedItem.uri);
      const ocrResult = await extractTextFromImage(base64Data, mediaType);
      resultItem.extractedText = ocrResult.extractedText || '';
      resultItem.detectedLanguage = ocrResult.detectedLanguage || 'Unknown';

      if (resultItem.extractedText) {
        resultItem.translatedText = await translateText(
          resultItem.extractedText,
          resultItem.detectedLanguage,
          targetLang
        );
      }
    } catch (err) {
      resultItem.error = err.message || 'Unknown error occurred.';
    }

    setResults((prev) => [...prev, resultItem]);
    setProcessedCount(1);
    setProcessing(false);
  }, [targetLang]);

  /** Reset all results and start fresh */
  const resetAll = () => {
    setResults([]);
    setProcessedCount(0);
    setTotalImages(0);
    setProcessing(false);
  };

  /** Clear history from storage and state */
  const clearHistory = async () => {
    Alert.alert('Clear History', 'Remove all translation history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          setHistory([]);
          try { await AsyncStorage.removeItem(STORAGE_KEYS.HISTORY); } catch (_) {}
        },
      },
    ]);
  };

  // ══════════════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════════════

  const showResults = results.length > 0 || processing;

  return (
    <View style={styles.container}>
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Image Translator</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Tabs: Translate | History */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'translate' && styles.tabActive]}
            onPress={() => { setActiveTab('translate'); setHistoryDetail(null); }}
          >
            <Ionicons name="scan-outline" size={16} color={activeTab === 'translate' ? COLORS.accent : COLORS.textDim} />
            <Text style={[styles.tabText, activeTab === 'translate' && styles.tabTextActive]}>
              Translate
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.tabActive]}
            onPress={() => { setActiveTab('history'); setHistoryDetail(null); }}
          >
            <Ionicons name="time-outline" size={16} color={activeTab === 'history' ? COLORS.accent : COLORS.textDim} />
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
              History
            </Text>
            {history.length > 0 && (
              <View style={styles.historyBadge}>
                <Text style={styles.historyBadgeText}>{history.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── TRANSLATE TAB ──────────────────────────────────────────── */}
      {activeTab === 'translate' && (
        <ScrollView
          ref={scrollRef}
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Language selector bar */}
          <TouchableOpacity
            style={styles.langSelector}
            onPress={() => setShowLangPicker(true)}
            activeOpacity={0.7}
          >
            <View style={styles.langSelectorLeft}>
              <Ionicons name="language" size={20} color={COLORS.accent} />
              <Text style={styles.langSelectorLabel}>Translate to:</Text>
            </View>
            <View style={styles.langSelectorRight}>
              <Text style={styles.langSelectorValue}>{targetLang}</Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.textMuted} />
            </View>
          </TouchableOpacity>

          {/* If no results and not processing, show empty state */}
          {!showResults && (
            <EmptyState onCamera={pickFromCamera} onGallery={pickFromGallery} />
          )}

          {/* Processing progress */}
          {processing && (
            <ProgressBar current={processedCount} total={totalImages} />
          )}

          {/* Results list */}
          {results.map((item) => (
            <ResultCard key={item.id} item={item} onRetry={retryItem} />
          ))}

          {/* Skeleton for currently processing image */}
          {processing && processedCount < totalImages && (
            <ProcessingCard index={processedCount} total={totalImages} />
          )}

          {/* Action buttons when we have results */}
          {showResults && (
            <View style={styles.bottomActions}>
              {!processing && (
                <>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={pickFromGallery}>
                    <Ionicons name="add-circle-outline" size={20} color={COLORS.accent} />
                    <Text style={styles.secondaryBtnText}>Add More Images</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.secondaryBtn, { borderColor: COLORS.red }]}
                    onPress={resetAll}
                  >
                    <Ionicons name="trash-outline" size={20} color={COLORS.red} />
                    <Text style={[styles.secondaryBtnText, { color: COLORS.red }]}>Clear Results</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ── HISTORY TAB ────────────────────────────────────────────── */}
      {activeTab === 'history' && !historyDetail && (
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
          {history.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: COLORS.blueSoft }]}>
                <Ionicons name="time-outline" size={56} color={COLORS.blue} />
              </View>
              <Text style={styles.emptyTitle}>No History Yet</Text>
              <Text style={styles.emptyDesc}>
                Your past translations will appear here.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>
                  {history.length} {history.length === 1 ? 'Session' : 'Sessions'}
                </Text>
                <TouchableOpacity onPress={clearHistory}>
                  <Text style={styles.clearHistoryText}>Clear All</Text>
                </TouchableOpacity>
              </View>
              {history.map((session) => (
                <HistoryCard
                  key={session.id}
                  session={session}
                  onPress={() => setHistoryDetail(session)}
                />
              ))}
            </>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ── HISTORY DETAIL VIEW ────────────────────────────────────── */}
      {activeTab === 'history' && historyDetail && (
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.historyBackBtn}
            onPress={() => setHistoryDetail(null)}
          >
            <Ionicons name="arrow-back" size={18} color={COLORS.accent} />
            <Text style={styles.historyBackText}>Back to History</Text>
          </TouchableOpacity>
          <Text style={styles.historyDetailDate}>
            {new Date(historyDetail.timestamp).toLocaleString()}
          </Text>
          {historyDetail.results?.map((item, idx) => (
            <ResultCard key={item.id || idx} item={item} onRetry={() => {}} />
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ── LANGUAGE PICKER MODAL ──────────────────────────────────── */}
      <LanguagePickerModal
        visible={showLangPicker}
        onClose={() => setShowLangPicker(false)}
        selectedLanguage={targetLang}
        onSelect={setAndPersistLang}
      />
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  STYLES
// ══════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // ── Header ──────────────────────────────────────────────────────
  header: {
    backgroundColor: '#131b33',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.inputBg,
    justifyContent: 'center', alignItems: 'center',
  },
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
  },

  // ── Tabs ────────────────────────────────────────────────────────
  tabRow: {
    flexDirection: 'row',
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: COLORS.accent },
  tabText: { color: COLORS.textDim, fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: COLORS.accent },
  historyBadge: {
    backgroundColor: COLORS.accent,
    borderRadius: 10, minWidth: 20, height: 20,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 5,
  },
  historyBadgeText: { color: COLORS.text, fontSize: 10, fontWeight: '700' },

  // ── Body ────────────────────────────────────────────────────────
  body: { flex: 1 },
  bodyContent: { padding: 20, paddingTop: 16 },

  // ── Language Selector ───────────────────────────────────────────
  langSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  langSelectorLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  langSelectorLabel: { color: COLORS.textMuted, fontSize: 14 },
  langSelectorRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  langSelectorValue: { color: COLORS.accent, fontSize: 16, fontWeight: '700' },

  // ── Empty State ─────────────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: COLORS.accentSoft,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyDesc: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    maxWidth: 300,
  },

  // ── Buttons ─────────────────────────────────────────────────────
  primaryBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.accent,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    marginBottom: 12,
  },
  primaryBtnText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    marginBottom: 12,
  },
  secondaryBtnText: {
    color: COLORS.accent,
    fontSize: 15,
    fontWeight: '700',
  },

  // ── Progress Bar ────────────────────────────────────────────────
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  progressBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.inputBg,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 3,
  },
  progressLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },

  // ── Result Cards ────────────────────────────────────────────────
  resultCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  errorCard: { borderWidth: 1, borderColor: COLORS.red + '44' },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 70, height: 70, borderRadius: 12,
    backgroundColor: COLORS.inputBg,
  },
  resultTimestamp: {
    color: COLORS.textDim,
    fontSize: 11,
    marginTop: 6,
  },

  // Processing skeleton
  processingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    backgroundColor: COLORS.accentSoft,
    padding: 10,
    borderRadius: 10,
  },
  processingText: { color: COLORS.accent, fontSize: 13, fontWeight: '600' },

  // Collapsible
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  collapsibleTitle: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
  originalTextBox: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 4,
  },
  originalText: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // Translated text
  translatedBox: {
    backgroundColor: COLORS.greenSoft,
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
  },
  translatedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  translatedLabel: { color: COLORS.green, fontSize: 12, fontWeight: '700' },
  translatedText: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 24,
  },

  // Action buttons row
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
  },
  actionBtnText: { fontSize: 14, fontWeight: '700' },

  // Error card contents
  errorTitle: { color: COLORS.red, fontSize: 14, fontWeight: '700' },
  errorMessage: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 12,
  },
  retryText: { color: COLORS.text, fontSize: 14, fontWeight: '700' },

  // No text found
  noTextTitle: { color: COLORS.textMuted, fontSize: 14, fontWeight: '700' },
  noTextDesc: { color: COLORS.textDim, fontSize: 12, marginTop: 4 },

  // Bottom actions (after results)
  bottomActions: { marginTop: 4 },

  // ── Language Badges ─────────────────────────────────────────────
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, fontWeight: '700' },

  // ── Language Picker Modal ───────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  languageModal: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    padding: 20,
    paddingTop: 16,
  },
  languageModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  languageModalTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    padding: 0,
  },
  langItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  langItemActive: { backgroundColor: COLORS.accentSoft },
  langItemText: { color: COLORS.text, fontSize: 15 },
  langItemTextActive: { color: COLORS.accent, fontWeight: '700' },
  noResultsText: {
    color: COLORS.textDim,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },

  // ── History Tab ─────────────────────────────────────────────────
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  clearHistoryText: { color: COLORS.red, fontSize: 13, fontWeight: '600' },
  historyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyThumb: {
    width: 48, height: 48,
    borderRadius: 10,
    backgroundColor: COLORS.inputBg,
  },
  historyPreview: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 6,
    lineHeight: 16,
  },
  historyDate: { color: COLORS.textDim, fontSize: 11, marginTop: 4 },
  historyBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  historyBackText: { color: COLORS.accent, fontSize: 14, fontWeight: '600' },
  historyDetailDate: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginBottom: 16,
  },
});
