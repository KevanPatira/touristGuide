// screens/ImageTranslatorScreen.js — Google Gemini Vision OCR + Translation
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
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';

import { useAuth } from '../constants/AuthContext';
import { translationService } from '../services/translation.service';

import { useTheme } from '../constants/ThemeContext';
import GlassCard from '../components/ui/GlassCard';
import PressableGoldButton from '../components/ui/PressableGoldButton';
import StaggerRevealText from '../components/ui/StaggerRevealText';
import AnimatedProgressBar from '../components/ui/AnimatedProgressBar';
import LanguagePill from '../components/ui/LanguagePill';
import Toast from '../components/ui/Toast';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

const STORAGE_KEYS = {
  DEFAULT_LANGUAGE: '@img_translator_default_lang',
  HISTORY: '@img_translator_history',
};

const MAX_HISTORY = 20;

const LANGUAGES = [
  'English', 'French', 'Spanish', 'German', 'Italian',
  'Japanese', 'Chinese Simplified', 'Chinese Traditional', 'Korean', 'Arabic',
  'Hindi', 'Portuguese', 'Russian', 'Thai', 'Vietnamese',
  'Indonesian', 'Malay', 'Turkish', 'Dutch', 'Swedish',
  'Polish', 'Greek', 'Hebrew', 'Czech', 'Romanian',
  'Hungarian', 'Danish', 'Finnish', 'Norwegian', 'Ukrainian',
  'Bengali', 'Tamil', 'Swahili', 'Persian', 'Filipino',
];

const getFlagForLanguage = (lang) => {
  const map = {
    'English': '🇬🇧', 'French': '🇫🇷', 'Spanish': '🇪🇸', 'German': '🇩🇪', 'Italian': '🇮🇹',
    'Japanese': '🇯🇵', 'Chinese Simplified': '🇨🇳', 'Chinese Traditional': '🇹🇼', 'Korean': '🇰🇷',
    'Arabic': '🇸🇦', 'Hindi': '🇮🇳', 'Portuguese': '🇵🇹', 'Russian': '🇷🇺', 'Thai': '🇹🇭',
  };
  return map[lang] || '🌐';
};

// ══════════════════════════════════════════════════════════════════════
//  HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════════════

const uriToBase64 = async (uri) => {
  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
};

const detectMediaType = (uri) => {
  const lower = (uri || '').toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
};

const shareText = async (text, title = 'Translation') => {
  try {
    await Share.share({ message: text, title });
  } catch (_) { /* user cancelled */ }
};

// ══════════════════════════════════════════════════════════════════════
//  GOOGLE GEMINI API CALLS
// ══════════════════════════════════════════════════════════════════════

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const fetchWithRetry = async (url, options, maxRetries = 3) => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);
    if (response.status === 429 && attempt < maxRetries) {
      const delay = Math.pow(2, attempt + 1) * 1000;
      console.log(`Rate limited (429). Retrying in ${delay / 1000}s...`);
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }
    return response;
  }
};

const extractTextFromImage = async (base64Data, mediaType) => {
  if (!GEMINI_API_KEY) throw new Error('API key not configured.');
  const response = await fetchWithRetry(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inline_data: { mime_type: mediaType, data: base64Data } },
          { text: `Extract ALL text visible in this image exactly as it appears. Then detect the language. Return a JSON object with keys: "extractedText", "detectedLanguage". If no text is found return {"extractedText":"","detectedLanguage":"Unknown"}. Return ONLY raw JSON.` },
        ],
      }],
    }),
  });

  if (!response.ok) throw new Error(`API error ${response.status}`);
  const result = await response.json();
  const raw = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { extractedText: raw, detectedLanguage: 'Unknown' };
  }
};

const translateText = async (text, sourceLang, targetLang) => {
  if (!GEMINI_API_KEY) throw new Error('API key not configured.');
  if (sourceLang.toLowerCase() === targetLang.toLowerCase()) return text;

  const response = await fetchWithRetry(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: `Translate the following ${sourceLang} text into ${targetLang}. Return ONLY the translated text.\n\n${text}` }],
      }],
    }),
  });

  if (!response.ok) throw new Error(`API error ${response.status}`);
  const result = await response.json();
  return result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
};

// ══════════════════════════════════════════════════════════════════════
//  COMPONENTS
// ══════════════════════════════════════════════════════════════════════

function SkeletonBlock({ width = '100%', height = 16, style }) {
  const { theme } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1000, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: 1000, useNativeDriver: false }),
      ])
    ).start();
  }, [anim]);

  const backgroundColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.obsidian, theme.colors.midnight],
  });

  return (
    <Animated.View style={[{ width, height, backgroundColor, borderRadius: 8 }, style]} />
  );
}

function ResultCard({ item, onRetry, onCopy }) {
  const { theme } = useTheme();
  const [showOriginal, setShowOriginal] = useState(false);

  if (item.error) {
    return (
      <GlassCard style={{ marginBottom: 16, borderColor: theme.colors.crimson }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image source={{ uri: item.uri }} style={{ width: 70, height: 70, borderRadius: 12 }} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={[theme.typography.label, { color: theme.colors.crimson }]}>Failed</Text>
            <Text style={[theme.typography.caption, { color: theme.colors.parchment }]} numberOfLines={2}>{item.error}</Text>
          </View>
        </View>
        <PressableGoldButton label="Retry" onPress={() => onRetry(item)} variant="outline" style={{ marginTop: 12 }} />
      </GlassCard>
    );
  }

  if (!item.extractedText && !item.error) {
    return (
      <GlassCard style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image source={{ uri: item.uri }} style={{ width: 70, height: 70, borderRadius: 12 }} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={[theme.typography.label, { color: theme.colors.parchment }]}>No Text Found</Text>
          </View>
        </View>
      </GlassCard>
    );
  }

  return (
    <GlassCard style={{ marginBottom: 16 }}>
      {/* Top Row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
        <Image source={{ uri: item.uri }} style={{ width: 60, height: 60, borderRadius: 12, marginRight: 14 }} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
            <LanguagePill language={item.detectedLanguage} flag={getFlagForLanguage(item.detectedLanguage)} detected />
            <Ionicons name="arrow-forward" size={14} color={theme.colors.parchment} style={{ marginHorizontal: 6 }} />
            <LanguagePill language={item.targetLanguage} flag={getFlagForLanguage(item.targetLanguage)} />
          </View>
        </View>
      </View>

      {/* Original Text */}
      <TouchableOpacity
        onPress={() => setShowOriginal(!showOriginal)}
        style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}
      >
        <Text style={[theme.typography.caption, { color: theme.colors.parchment }]}>Original Text</Text>
        <Ionicons name={showOriginal ? 'chevron-up' : 'chevron-down'} size={14} color={theme.colors.parchment} />
      </TouchableOpacity>
      
      {showOriginal && (
        <View style={{ backgroundColor: theme.colors.obsidian, padding: 12, borderRadius: 12, marginBottom: 12 }}>
          <Text style={[theme.typography.body, { color: theme.colors.parchment }]} selectable>{item.extractedText}</Text>
        </View>
      )}

      {/* Translated Text */}
      <View style={{ paddingVertical: 12 }}>
        <Text style={[theme.typography.displayM, { color: theme.colors.ivory }]} selectable>
          {item.translatedText}
        </Text>
      </View>

      {/* Actions */}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
        <PressableGoldButton
          label="Copy"
          icon={<Ionicons name="copy-outline" size={18} color={theme.colors.gold} />}
          variant="ghost"
          onPress={() => onCopy(item.translatedText)}
          style={{ flex: 1 }}
        />
        <PressableGoldButton
          label="Share"
          icon={<Ionicons name="share-outline" size={18} color={theme.colors.gold} />}
          variant="ghost"
          onPress={() => shareText(`[${item.detectedLanguage} → ${item.targetLanguage}]\n\n${item.translatedText}`)}
          style={{ flex: 1 }}
        />
      </View>
    </GlassCard>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════

export default function ImageTranslatorScreen({ navigation }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const toastRef = useRef(null);

  const [targetLang, setTargetLang] = useState('English');
  const [showLangPicker, setShowLangPicker] = useState(false);
  
  const [results, setResults] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalImages, setTotalImages] = useState(0);
  
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const historyDrawerAnim = useRef(new Animated.Value(SCREEN_W)).current;

  useEffect(() => {
    (async () => {
      try {
        const savedLang = await AsyncStorage.getItem(STORAGE_KEYS.DEFAULT_LANGUAGE);
        if (savedLang) setTargetLang(savedLang);
        
        // Fetch history from backend
        const response = await translationService.getHistory(1, 20);
        if (response.data && response.data.history) {
          setHistory(response.data.history);
        }
      } catch (err) {
        console.error('Failed to load history:', err);
      }
    })();
  }, []);

  const toggleHistory = () => {
    if (showHistory) {
      Animated.timing(historyDrawerAnim, { toValue: SCREEN_W, duration: 300, useNativeDriver: true }).start(() => setShowHistory(false));
    } else {
      setShowHistory(true);
      Animated.timing(historyDrawerAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    }
  };

  const handleCopy = async (text) => {
    await Clipboard.setStringAsync(text);
    toastRef.current?.show('Copied to clipboard!');
  };

  const setAndPersistLang = async (lang) => {
    setTargetLang(lang);
    try { await AsyncStorage.setItem(STORAGE_KEYS.DEFAULT_LANGUAGE, lang); } catch (_) {}
  };

  const saveToHistory = async (resultItems) => {
    try {
      const validResults = resultItems.filter((r) => r.extractedText && !r.error);
      if (validResults.length === 0) return;
      
      const newItems = [];
      for (const res of validResults) {
        const payload = {
          sourceLanguage: res.detectedLanguage || 'Unknown',
          targetLanguage: res.targetLanguage || targetLang,
          originalText: res.extractedText,
          translatedText: res.translatedText,
        };
        const response = await translationService.saveTranslation(payload);
        if (response.data && response.data.translation) {
           newItems.push(response.data.translation);
        }
      }

      if (newItems.length > 0) {
        setHistory(prev => [...newItems, ...prev].slice(0, MAX_HISTORY));
      }
    } catch (err) {
      console.error('Error saving translation history:', err);
    }
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets) processImages(result.assets);
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, quality: 0.8 });
    if (!result.canceled && result.assets) processImages(result.assets);
  };

  const processImages = async (assets) => {
    const validAssets = assets.filter(a => a && a.uri);
    if (!validAssets.length) return;

    setProcessing(true);
    setResults([]);
    setTotalImages(validAssets.length);
    const allResults = [];

    for (let i = 0; i < validAssets.length; i++) {
      setProcessedCount(i);
      const asset = validAssets[i];
      let res = { id: `${Date.now()}_${i}`, uri: asset.uri, targetLanguage: targetLang, extractedText: '', translatedText: '', error: null };
      
      try {
        const base64Data = await uriToBase64(asset.uri);
        const mediaType = detectMediaType(asset.uri);
        const ocr = await extractTextFromImage(base64Data, mediaType);
        res.extractedText = ocr.extractedText;
        res.detectedLanguage = ocr.detectedLanguage;
        
        if (res.extractedText) {
          res.translatedText = await translateText(res.extractedText, res.detectedLanguage, targetLang);
        }
      } catch (err) {
        res.error = err.message;
      }
      
      allResults.push(res);
      setResults([...allResults]);
      setProcessedCount(i + 1);
    }

    setProcessing(false);
    await saveToHistory(allResults);
  };

  const showResults = results.length > 0 || processing;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.obsidian }}>
      {/* HEADER */}
      <View style={{ paddingTop: 60, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.gold} />
        </TouchableOpacity>
        
        <StaggerRevealText text="Image Translator" style={[theme.typography.displayM, { color: theme.colors.ivory }]} staggerDelay={30} />
        
        <TouchableOpacity onPress={toggleHistory} style={{ padding: 8 }}>
          <Ionicons name="time-outline" size={24} color={theme.colors.gold} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Language Selector */}
        <TouchableOpacity onPress={() => setShowLangPicker(true)}>
          <GlassCard style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="language" size={20} color={theme.colors.gold} />
              <Text style={[theme.typography.body, { color: theme.colors.parchment }]}>Translate to:</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[theme.typography.headingS, { color: theme.colors.ivory }]}>{targetLang}</Text>
              <Ionicons name="chevron-down" size={16} color={theme.colors.gold} />
            </View>
          </GlassCard>
        </TouchableOpacity>

        {/* Empty State */}
        {!showResults && (
          <View style={{ borderWidth: 2, borderColor: theme.colors.borderGold, borderStyle: 'dashed', borderRadius: 20, padding: 30, alignItems: 'center', marginTop: 20 }}>
            <Ionicons name="scan-outline" size={60} color={theme.colors.goldMuted} style={{ marginBottom: 16 }} />
            <Text style={[theme.typography.headingS, { color: theme.colors.parchment, marginBottom: 24, textAlign: 'center' }]}>
              Capture signs, menus, or documents
            </Text>
            <PressableGoldButton label="Take Photo" onPress={pickFromCamera} icon={<Ionicons name="camera" size={20} color={theme.colors.ivory} />} style={{ width: '100%', marginBottom: 12 }} />
            <PressableGoldButton label="Choose from Gallery" variant="outline" onPress={pickFromGallery} icon={<Ionicons name="images" size={20} color={theme.colors.gold} />} style={{ width: '100%' }} />
          </View>
        )}

        {/* Processing State */}
        {processing && (
          <View style={{ marginBottom: 20 }}>
            <AnimatedProgressBar progress={totalImages > 0 ? processedCount / totalImages : 0} label={`Processing... ${processedCount}/${totalImages}`} />
          </View>
        )}

        {/* Results */}
        {results.map((item) => (
          <ResultCard key={item.id} item={item} onRetry={() => {}} onCopy={handleCopy} />
        ))}

      </ScrollView>

      {/* History Drawer */}
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: historyDrawerAnim }], zIndex: 100, flexDirection: 'row' }]}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={toggleHistory} />
        <View style={{ width: SCREEN_W * 0.85, backgroundColor: theme.colors.midnight, shadowColor: '#000', shadowOffset: { width: -5, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10 }}>
          <View style={{ paddingTop: 60, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.colors.borderSilver, paddingBottom: 20 }}>
            <Text style={[theme.typography.headingS, { color: theme.colors.ivory }]}>Recent Translations</Text>
            <TouchableOpacity onPress={toggleHistory}>
              <Ionicons name="close" size={24} color={theme.colors.parchment} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {history.map(session => (
              <GlassCard key={session._id || session.id} style={{ marginBottom: 12, padding: 12 }}>
                <View style={{ flexDirection: 'row' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[theme.typography.caption, { color: theme.colors.gold }]}>{session.sourceLanguage} → {session.targetLanguage}</Text>
                    <Text style={[theme.typography.body, { color: theme.colors.ivory, marginTop: 4 }]} numberOfLines={1}>{session.translatedText}</Text>
                  </View>
                </View>
              </GlassCard>
            ))}
          </ScrollView>
        </View>
      </Animated.View>

      {/* Language Picker Modal */}
      <Modal visible={showLangPicker} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.colors.midnight, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '75%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={[theme.typography.displayM, { color: theme.colors.ivory }]}>Target Language</Text>
              <TouchableOpacity onPress={() => setShowLangPicker(false)}>
                <Ionicons name="close-circle" size={28} color={theme.colors.parchment} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={LANGUAGES}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => { setAndPersistLang(item); setShowLangPicker(false); }} style={{ paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={[theme.typography.body, { color: item === targetLang ? theme.colors.gold : theme.colors.ivory }]}>{item}</Text>
                  {item === targetLang && <Ionicons name="checkmark" size={20} color={theme.colors.gold} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <Toast ref={toastRef} />
    </View>
  );
}
