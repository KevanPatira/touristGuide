// screens/ImageTranslatorScreen.js - OCR.space + OpenRouter Translation
import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Dimensions,
  Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import s from './styles/ImageTranslatorScreen.styles';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';

import { useTheme } from '../constants/ThemeContext';
import GlassCard from '../components/ui/GlassCard';
import PressableGoldButton from '../components/ui/PressableGoldButton';
import LanguagePill from '../components/ui/LanguagePill';
import Toast from '../components/ui/Toast';

// ══════════════════════════════════════════════════════════════════════
//  API KEYS
// ══════════════════════════════════════════════════════════════════════

// Free OCR.space API key
const OCR_API_KEY = process.env.EXPO_PUBLIC_OCR_API_KEY;

// OpenRouter API
const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
const OPENROUTER_MODEL = 'openai/gpt-oss-120b:free';

// ══════════════════════════════════════════════════════════════════════
//  LANGUAGES — All major Indian languages + English
// ══════════════════════════════════════════════════════════════════════

const LANGUAGES = [
  { name: 'English',   native: 'English',  flag: '🇬🇧' },
  { name: 'Hindi',     native: 'हिंदी',     flag: '🇮🇳' },
  { name: 'Bengali',   native: 'বাংলা',     flag: '🇮🇳' },
  { name: 'Telugu',    native: 'తెలుగు',    flag: '🇮🇳' },
  { name: 'Marathi',   native: 'मराठी',     flag: '🇮🇳' },
  { name: 'Tamil',     native: 'தமிழ்',    flag: '🇮🇳' },
  { name: 'Urdu',      native: 'اردو',     flag: '🇵🇰' },
  { name: 'Gujarati',  native: 'ગુજરાતી',  flag: '🇮🇳' },
  { name: 'Kannada',   native: 'ಕನ್ನಡ',    flag: '🇮🇳' },
  { name: 'Malayalam', native: 'മലയാളം',   flag: '🇮🇳' },
  { name: 'Odia',      native: 'ଓଡ଼ିଆ',    flag: '🇮🇳' },
  { name: 'Punjabi',   native: 'ਪੰਜਾਬੀ',   flag: '🇮🇳' },
  { name: 'Assamese',  native: 'অসমীয়া',  flag: '🇮🇳' },
];

// ══════════════════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════════════════

const uriToBase64 = async (uri) => {
  return FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
};

const { width: SCREEN_W } = Dimensions.get('window');

// ══════════════════════════════════════════════════════════════════════
//  OCR.space — text extraction
// ══════════════════════════════════════════════════════════════════════

const extractTextWithOCR = async (base64Data) => {
  const formData = new FormData();
  formData.append('base64Image', `data:image/jpeg;base64,${base64Data}`);
  formData.append('language', 'eng');
  formData.append('isOverlayRequired', 'false');
  formData.append('OCREngine', '2');

  const response = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    headers: { apikey: OCR_API_KEY },
    body: formData,
  });

  const result = await response.json();

  if (result.IsErroredOnProcessing) {
    console.log('OCR Error:', result.ErrorMessage);
    return null;
  }
  if (result.ParsedResults && result.ParsedResults.length > 0) {
    const text = result.ParsedResults.map((r) => r.ParsedText)
      .join('\n')
      .trim();
    if (text) return text;
  }
  return null;
};

// ══════════════════════════════════════════════════════════════════════
//  OpenRouter — translation
// ══════════════════════════════════════════════════════════════════════

const translateWithOpenRouter = async (text, lang) => {
  const response = await fetch(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://touristguide.app',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the given text into ${lang}. Return ONLY the translated text, nothing else. Do not add any explanations, prefixes, or conversational filler.`,
          },
          { role: 'user', content: text },
        ],
        max_tokens: 1500,
      }),
    }
  );

  const result = await response.json();
  if (result.error) return null;
  if (result.choices && result.choices[0] && result.choices[0].message) {
    return result.choices[0].message.content.trim();
  }
  return null;
};

// ══════════════════════════════════════════════════════════════════════
//  PULSING ICON  (themed placeholder animation)
// ══════════════════════════════════════════════════════════════════════

function PulsingIcon({ name, size, color }) {
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1.12,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [anim]);

  return (
    <Animated.View style={{ transform: [{ scale: anim }] }}>
      <Ionicons name={name} size={size} color={color} />
    </Animated.View>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════

export default function ImageTranslatorScreen({ navigation }) {
  const { theme } = useTheme();
  const toastRef = useRef(null);

  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [targetLang, setTargetLang] = useState('Hindi');
  // step: 1 = pick image, 2 = preview + choose language, 3 = result
  const [step, setStep] = useState(1);

  // ─── Image result handler ───
  const handleImageResult = useCallback(async (result) => {
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setImage(asset.uri);

      let base64Data = asset.base64;
      if (!base64Data) {
        try {
          base64Data = await uriToBase64(asset.uri);
        } catch (err) {
          console.log('Base64 conversion failed:', err);
        }
      }

      if (base64Data) {
        setImageBase64(base64Data);
        setStep(2);
      } else {
        Alert.alert('Error', 'Could not read image data. Please try again.');
      }
    }
  }, []);

  const pickOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.8,
    base64: true,
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Camera access is required to take photos.'
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync(pickOptions);
    await handleImageResult(result);
  };

  const pickFromGallery = async () => {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Gallery access is required to pick photos.'
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync(pickOptions);
    await handleImageResult(result);
  };

  // ─── Extract + Translate pipeline ───
  const extractAndTranslate = async () => {
    setLoading(true);
    setExtractedText('');
    setTranslatedText('');
    setLoadingMessage('Extracting text from image...');

    try {
      const text = await extractTextWithOCR(imageBase64);
      if (!text) {
        Alert.alert(
          'No text found',
          'Could not extract any text from the image. Try a clearer image with visible text.'
        );
        setLoading(false);
        setLoadingMessage('');
        return;
      }
      setExtractedText(text);

      setLoadingMessage(`Translating to ${targetLang}...`);
      const translation = await translateWithOpenRouter(text, targetLang);
      if (translation) {
        setTranslatedText(translation);
      } else {
        setTranslatedText('Translation failed. Please try again.');
      }
    } catch (err) {
      console.log('Pipeline error:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }

    setLoading(false);
    setLoadingMessage('');
    setStep(3);
  };

  // ─── Re-translate with a new language (from results step) ───
  const retranslate = async (newLang) => {
    if (!extractedText) return;
    setTargetLang(newLang);
    setLoading(true);
    setLoadingMessage(`Translating to ${newLang}...`);

    try {
      const translation = await translateWithOpenRouter(extractedText, newLang);
      if (translation) {
        setTranslatedText(translation);
      } else {
        setTranslatedText('Translation failed. Please try again.');
      }
    } catch (err) {
      console.log('Retranslate error:', err);
      setTranslatedText('Translation failed. Please try again.');
    }

    setLoading(false);
    setLoadingMessage('');
  };

  // ─── Clipboard ───
  const copyToClipboard = async (text) => {
    await Clipboard.setStringAsync(text);
    toastRef.current?.show('Copied to clipboard!');
  };

  // ─── Reset ───
  const reset = () => {
    setImage(null);
    setImageBase64(null);
    setExtractedText('');
    setTranslatedText('');
    setLoadingMessage('');
    setStep(1);
  };

  // ─── Current language object ───
  const currentLangObj = LANGUAGES.find((l) => l.name === targetLang) || LANGUAGES[1];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.obsidian }}>
      {/* ════════ HEADER ════════ */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => navigation?.goBack?.()}
          style={{ padding: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.gold} />
        </TouchableOpacity>

        <Text
          style={[
            theme.typography.displayM,
            { color: theme.colors.ivory, flex: 1, textAlign: 'center' },
          ]}
        >
          Image Translator
        </Text>

        {/* Placeholder to keep title centred */}
        <View style={{ width: 40 }} />
      </View>

      {/* ════════ SUB-HEADER ════════ */}
      <View style={s.subHeader}>
        <Text style={[theme.typography.caption, { color: theme.colors.parchment, textAlign: 'center' }]}>
          {step === 1 && '📸  Capture or pick an image to translate'}
          {step === 2 && '🌐  Preview & select target language'}
          {step === 3 && '🎉  Translation complete!'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        {/* ═══════════════════════════════════════════════════════════════
            STEP 1 — Pick an image
        ═══════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <GlassCard style={{ padding: 30, alignItems: 'center' }}>
            <View style={s.iconCircle}>
              <PulsingIcon
                name="scan-outline"
                size={50}
                color={theme.colors.gold}
              />
            </View>

            <Text
              style={[
                theme.typography.displayS,
                { color: theme.colors.ivory, marginBottom: 8 },
              ]}
            >
              Scan & Translate
            </Text>
            <Text
              style={[
                theme.typography.body,
                {
                  color: theme.colors.parchment,
                  textAlign: 'center',
                  marginBottom: 28,
                },
              ]}
            >
              Instantly extract and translate text from any image using AI.
            </Text>

            <PressableGoldButton
              label="Take a Picture"
              onPress={pickFromCamera}
              icon={
                <Ionicons
                  name="camera"
                  size={20}
                  color={theme.colors.ivory}
                />
              }
              style={{ width: '100%', marginBottom: 14 }}
            />

            <PressableGoldButton
              label="Choose from Gallery"
              variant="outline"
              onPress={pickFromGallery}
              icon={
                <Ionicons
                  name="images"
                  size={20}
                  color={theme.colors.gold}
                />
              }
              style={{ width: '100%' }}
            />
          </GlassCard>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            STEP 2 — Preview image + Language selection
        ═══════════════════════════════════════════════════════════════ */}
        {step === 2 && image && (
          <>
            {/* Image Preview */}
            <GlassCard style={{ padding: 10, marginBottom: 20 }}>
              <Image
                source={{ uri: image }}
                style={s.imagePreview}
                resizeMode="contain"
              />
              <TouchableOpacity style={s.repickBtn} onPress={reset}>
                <Ionicons name="refresh" size={16} color={theme.colors.ivory} />
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.ivory, marginLeft: 6 },
                  ]}
                >
                  Retake / Reselect
                </Text>
              </TouchableOpacity>
            </GlassCard>

            {/* Section title */}
            <Text
              style={[
                theme.typography.headingS,
                { color: theme.colors.ivory, marginBottom: 14, marginLeft: 4 },
              ]}
            >
              Translate To
            </Text>

            {/* Language grid */}
            <View style={s.langGrid}>
              {LANGUAGES.map((lang) => {
                const isActive = targetLang === lang.name;
                return (
                  <TouchableOpacity
                    key={lang.name}
                    onPress={() => setTargetLang(lang.name)}
                    style={[
                      s.langChip,
                      {
                        borderColor: isActive
                          ? theme.colors.gold
                          : theme.colors.borderSilver,
                        backgroundColor: isActive
                          ? 'rgba(201, 168, 76, 0.12)'
                          : theme.colors.glassBg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        theme.typography.headingS,
                        {
                          color: isActive
                            ? theme.colors.gold
                            : theme.colors.parchment,
                          fontSize: 15,
                        },
                      ]}
                    >
                      {lang.native}
                    </Text>
                    <Text
                      style={[
                        theme.typography.caption,
                        {
                          color: isActive
                            ? theme.colors.goldLight
                            : theme.colors.ash,
                          marginTop: 3,
                        },
                      ]}
                    >
                      {lang.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Translate button */}
            <PressableGoldButton
              label={
                loading
                  ? loadingMessage || 'PROCESSING...'
                  : `TRANSLATE TO ${targetLang.toUpperCase()}`
              }
              loading={loading}
              disabled={loading}
              onPress={extractAndTranslate}
              icon={
                !loading ? (
                  <Ionicons
                    name="language"
                    size={20}
                    color={theme.colors.ivory}
                  />
                ) : undefined
              }
              style={{ width: '100%', marginTop: 6 }}
            />
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            STEP 3 — Results
        ═══════════════════════════════════════════════════════════════ */}
        {step === 3 && image && (
          <>
            {/* ── Translated text card (primary focus) ── */}
            {translatedText ? (
              <GlassCard
                style={{
                  padding: 22,
                  marginBottom: 18,
                  borderColor: 'rgba(16, 185, 129, 0.35)',
                }}
              >
                <View style={s.cardHeader}>
                  <View style={s.headerTitleRow}>
                    <Ionicons
                      name="language"
                      size={20}
                      color={theme.colors.emerald}
                    />
                    <Text
                      style={[
                        theme.typography.headingS,
                        { color: theme.colors.emerald, marginLeft: 8 },
                      ]}
                    >
                      Translation ({currentLangObj.native})
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => copyToClipboard(translatedText)}
                    style={{ padding: 4 }}
                  >
                    <Ionicons
                      name="copy-outline"
                      size={20}
                      color={theme.colors.emerald}
                    />
                  </TouchableOpacity>
                </View>

                {loading ? (
                  <ActivityIndicator
                    color={theme.colors.emerald}
                    size="large"
                    style={{ marginVertical: 20 }}
                  />
                ) : (
                  <Text
                    style={[
                      theme.typography.displayS,
                      {
                        color: theme.colors.ivory,
                        lineHeight: 30,
                        marginTop: 4,
                      },
                    ]}
                    selectable
                  >
                    {translatedText}
                  </Text>
                )}
              </GlassCard>
            ) : null}

            {/* ── Original extracted text card ── */}
            <GlassCard style={{ padding: 22, marginBottom: 18 }}>
              <View style={s.cardHeader}>
                <View style={s.headerTitleRow}>
                  <Ionicons
                    name="document-text"
                    size={20}
                    color={theme.colors.gold}
                  />
                  <Text
                    style={[
                      theme.typography.headingS,
                      { color: theme.colors.gold, marginLeft: 8 },
                    ]}
                  >
                    Original Text
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => copyToClipboard(extractedText)}
                  style={{ padding: 4 }}
                >
                  <Ionicons
                    name="copy-outline"
                    size={20}
                    color={theme.colors.gold}
                  />
                </TouchableOpacity>
              </View>

              <Text
                style={[
                  theme.typography.body,
                  { color: theme.colors.parchment, lineHeight: 26 },
                ]}
                selectable
              >
                {extractedText}
              </Text>
            </GlassCard>

            {/* ── Re-translate to another language ── */}
            <Text
              style={[
                theme.typography.caption,
                {
                  color: theme.colors.parchment,
                  marginBottom: 12,
                  marginLeft: 4,
                  letterSpacing: 0.8,
                },
              ]}
            >
              TRANSLATE TO ANOTHER LANGUAGE
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 24 }}
            >
              <View style={s.retranslateRow}>
                {LANGUAGES.map((lang) => {
                  const isActive = targetLang === lang.name;
                  return (
                    <TouchableOpacity
                      key={lang.name}
                      onPress={() => retranslate(lang.name)}
                      disabled={loading}
                      style={[
                        s.retranslateChip,
                        {
                          borderColor: isActive
                            ? theme.colors.gold
                            : theme.colors.borderSilver,
                          backgroundColor: isActive
                            ? theme.colors.gold
                            : theme.colors.glassBg,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          theme.typography.caption,
                          {
                            color: isActive
                              ? theme.colors.obsidian
                              : theme.colors.parchment,
                            fontWeight: isActive ? '700' : '400',
                            fontSize: 13,
                          },
                        ]}
                      >
                        {lang.native}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* ── Start New Scan ── */}
            <PressableGoldButton
              label="Start New Scan"
              variant="outline"
              onPress={reset}
              icon={
                <Ionicons
                  name="scan"
                  size={20}
                  color={theme.colors.gold}
                />
              }
              style={{ width: '100%' }}
            />
          </>
        )}
      </ScrollView>

      <Toast ref={toastRef} />
    </View>
  );
}
