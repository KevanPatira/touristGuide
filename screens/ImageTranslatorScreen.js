// screens/ImageTranslatorScreen.js - Premium UI with Smart Language Selection
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Image,
  Alert, ActivityIndicator, Animated, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import s from './styles/ImageTranslatorScreen.styles';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../constants/ThemeContext';
import styles from './ImageTranslatorStyles';

// API Keys
const OCR_API_KEY = process.env.EXPO_PUBLIC_OCR_API_KEY;
const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
const OPENROUTER_MODEL = 'openai/gpt-oss-120b:free';

const INDIAN_LANGS = [
  { name: 'Hindi', native: 'हिंदी' },
  { name: 'Bengali', native: 'বাংলা' },
  { name: 'Telugu', native: 'తెలుగు' },
  { name: 'Marathi', native: 'मराठी' },
  { name: 'Tamil', native: 'தமிழ்' },
  { name: 'Urdu', native: 'اردو' },
  { name: 'Gujarati', native: 'ગુજરાતી' },
  { name: 'Kannada', native: 'ಕನ್ನಡ' },
  { name: 'Malayalam', native: 'മലയാളം' },
  { name: 'Odia', native: 'ଓଡ଼ିଆ' },
  { name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { name: 'Assamese', native: 'অসমীয়া' },
  { name: 'Maithili', native: 'मैथिली' },
  { name: 'Santali', native: 'ᱥᱟᱱᱛᱟᱲᱤ' },
  { name: 'Kashmiri', native: 'कॉशुर' },
  { name: 'Nepali', native: 'नेपाली' },
  { name: 'Sindhi', native: 'سنڌي' },
  { name: 'Dogri', native: 'डोगरी' },
  { name: 'Konkani', native: 'कोंकणी' },
  { name: 'Manipuri', native: 'মৈতৈলোন্' },
  { name: 'Bodo', native: 'बड़ो' },
  { name: 'Sanskrit', native: 'संस्कृतम्' },
];

const OTHER_LANGS = [
  { name: 'English', native: 'English' },
  { name: 'Chinese', native: '中文' },
  { name: 'Japanese', native: '日本語' },
  { name: 'French', native: 'Français' },
  { name: 'Spanish', native: 'Español' },
  { name: 'Russian', native: 'Русский' },
  { name: 'German', native: 'Deutsch' },
  { name: 'Korean', native: '한국어' },
  { name: 'Arabic', native: 'العربية' },
  { name: 'Portuguese', native: 'Português' },
  { name: 'Italian', native: 'Italiano' },
  { name: 'Thai', native: 'ไทย' },
  { name: 'Dutch', native: 'Nederlands' },
  { name: 'Turkish', native: 'Türkçe' },
  { name: 'Vietnamese', native: 'Tiếng Việt' },
  { name: 'Polish', native: 'Polski' },
  { name: 'Ukrainian', native: 'Українська' },
  { name: 'Swedish', native: 'Svenska' },
  { name: 'Greek', native: 'Ελληνικά' },
  { name: 'Indonesian', native: 'Bahasa' },
];

const ALL_LANGS = [...INDIAN_LANGS, ...OTHER_LANGS];

const uriToBase64 = async (uri) => {
  return await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
};

export default function ImageTranslatorScreen({ navigation }) {
  const { theme } = useTheme();
  const toastRef = useRef(null);

  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [targetLang, setTargetLang] = useState('Hindi');
  const [step, setStep] = useState(1); // 1=pick, 2=lang select, 3=results
  const [langCategory, setLangCategory] = useState(null); // 'indian' | 'other'
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateTransition = (callback) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      callback();
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleImageResult = async (result) => {
    if (!result.canceled && result.assets?.length > 0) {
      const asset = result.assets[0];
      setImage(asset.uri);
      let b64 = asset.base64;
      if (!b64) {
        try { b64 = await uriToBase64(asset.uri); } catch (e) { console.log(e); }
      }
      if (b64) {
        setImageBase64(b64);
        animateTransition(() => setStep(2));
      } else {
        Alert.alert('Error', 'Could not read image. Please try again.');
      }
    }
  };

  const pickOpts = { mediaTypes: ['images'], allowsEditing: true, quality: 0.8, base64: true };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Camera access required.'); return; }
    await handleImageResult(await ImagePicker.launchCameraAsync(pickOpts));
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Gallery access required.'); return; }
    await handleImageResult(await ImagePicker.launchImageLibraryAsync(pickOpts));
  };

  const extractText = async () => {
    if (!imageBase64) return null;
    setLoadingMsg('Extracting text from image...');
    try {
      const fd = new FormData();
      fd.append('base64Image', `data:image/jpeg;base64,${imageBase64}`);
      fd.append('language', 'eng');
      fd.append('isOverlayRequired', 'false');
      fd.append('OCREngine', '2');
      const res = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST', headers: { apikey: OCR_API_KEY }, body: fd,
      });
      const json = await res.json();
      if (json.IsErroredOnProcessing) return null;
      if (json.ParsedResults?.length > 0) {
        const t = json.ParsedResults.map(r => r.ParsedText).join('\n').trim();
        return t || null;
      }
      return null;
    } catch (e) { console.log(e); return null; }
  };

  const translate = async (text, lang) => {
    setLoadingMsg(`Translating to ${lang}...`);
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://touristguide.app',
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [
            { role: 'system', content: `You are a professional translator. Translate the given text into ${lang}. Return ONLY the translated text, nothing else.` },
            { role: 'user', content: text },
          ],
          max_tokens: 1500,
        }),
      });
      const json = await res.json();
      return json.choices?.[0]?.message?.content?.trim() || null;
    } catch (e) { console.log(e); return null; }
  };

  const extractAndTranslate = async () => {
    setLoading(true); setExtractedText(''); setTranslatedText('');
    const text = await extractText();
    if (!text) {
      Alert.alert('No text found', 'Could not extract text. Try a clearer image.');
      setLoading(false); return;
    }
    setExtractedText(text);
    const tr = await translate(text, targetLang);
    setTranslatedText(tr || 'Translation failed. Please try again.');
    setLoading(false); setLoadingMsg('');
    animateTransition(() => setStep(3));
  };

  const retranslate = async (lang) => {
    if (!extractedText) return;
    setTargetLang(lang); setLoading(true); setLoadingMsg(`Translating to ${lang}...`);
    const tr = await translate(extractedText, lang);
    setTranslatedText(tr || 'Translation failed.');
    setLoading(false); setLoadingMsg('');
  };

  const copyText = async (text) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied!', 'Text copied to clipboard.');
  };

  // ─── Reset ───
  const reset = () => {
    animateTransition(() => {
      setImage(null); setImageBase64(null); setExtractedText('');
      setTranslatedText(''); setLoadingMsg(''); setLangCategory(null); setStep(1);
    });
  };

  const currentLangs = langCategory === 'indian' ? INDIAN_LANGS : langCategory === 'other' ? OTHER_LANGS : [];

  const getStepLabel = () => {
    if (step === 1) return 'STEP 1 · CAPTURE';
    if (step === 2) return 'STEP 2 · SELECT LANGUAGE';
    return 'STEP 3 · RESULTS';
  };

  // ─── Current language object ───
  const currentLangObj = ALL_LANGS.find((l) => l.name === targetLang) || ALL_LANGS[1];

  return (
    <LinearGradient colors={['#0c0a1d', '#1a1145', '#0c0a1d']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Image Translator</Text>
            <Text style={styles.subtitle}>
              {step === 1 && 'Capture or select an image to translate'}
              {step === 2 && 'Choose your target language'}
              {step === 3 && 'Translation complete ✨'}
            </Text>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>{getStepLabel()}</Text>
            </View>
          </View>

          {/* ── Step 1: Pick Image ── */}
          {step === 1 && (
            <View style={styles.pickCard}>
              <View style={styles.iconCircle}>
                <Ionicons name="scan-outline" size={40} color="#a78bfa" />
              </View>
              <Text style={styles.pickTitle}>Scan & Translate</Text>
              <Text style={styles.pickDesc}>
                Extract and translate text from any image instantly using AI-powered recognition.
              </Text>
              <TouchableOpacity style={styles.camBtn} onPress={pickFromCamera}>
                <LinearGradient colors={['#8b5cf6', '#6d28d9']} style={styles.gradBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name="camera" size={22} color="#fff" />
                  <Text style={styles.btnText}>Take a Photo</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.gallBtn} onPress={pickFromGallery}>
                <View style={styles.outlineBtn}>
                  <Ionicons name="images" size={22} color="#a78bfa" />
                  <Text style={styles.outlineBtnText}>Choose from Gallery</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Step 2: Language Selection ── */}
          {step === 2 && image && (
            <View style={styles.stepContainer}>
              <View style={styles.previewCard}>
                <Image source={{ uri: image }} style={styles.imgPreview} resizeMode="contain" />
                <TouchableOpacity style={styles.repickBtn} onPress={reset}>
                  <Ionicons name="refresh" size={16} color="#fff" />
                  <Text style={styles.repickBtnText}>Retake</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>Choose Language Category</Text>
              <View style={styles.catRow}>
                <TouchableOpacity
                  style={[styles.catCard, langCategory === 'indian' && styles.catCardActive]}
                  onPress={() => { setLangCategory('indian'); setTargetLang('Hindi'); }}
                >
                  <View style={[styles.catIcon, langCategory === 'indian' && styles.catIconActive]}>
                    <Text style={{ fontSize: 22 }}>🇮🇳</Text>
                  </View>
                  <Text style={[styles.catTitle, langCategory === 'indian' && styles.catTitleActive]}>
                    Indian Languages
                  </Text>
                  <Text style={styles.catSub}>Hindi, Bengali, Tamil +19</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.catCard, langCategory === 'other' && styles.catCardActive]}
                  onPress={() => { setLangCategory('other'); setTargetLang('English'); }}
                >
                  <View style={[styles.catIcon, langCategory === 'other' && styles.catIconActive]}>
                    <Text style={{ fontSize: 22 }}>🌍</Text>
                  </View>
                  <Text style={[styles.catTitle, langCategory === 'other' && styles.catTitleActive]}>
                    Other Languages
                  </Text>
                  <Text style={styles.catSub}>English, Chinese, French +17</Text>
                </TouchableOpacity>
              </View>

              {langCategory && (
                <>
                  <Text style={styles.sectionTitle}>
                    {langCategory === 'indian' ? '🇮🇳 Select Language' : '🌍 Select Language'}
                  </Text>
                  <View style={styles.langGrid}>
                    {currentLangs.map((lang) => (
                      <TouchableOpacity
                        key={lang.name}
                        style={[styles.langChip, targetLang === lang.name && styles.langChipActive]}
                        onPress={() => setTargetLang(lang.name)}
                      >
                        <Text style={[styles.langChipText, targetLang === lang.name && styles.langChipTextActive]}>
                          {lang.native}
                        </Text>
                        <Text style={[styles.langChipSub, targetLang === lang.name && styles.langChipSubActive]}>
                          {lang.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[styles.translateWrap, loading && styles.disabled]}
                    onPress={extractAndTranslate}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={loading ? ['#374151', '#1f2937'] : ['#8b5cf6', '#6d28d9']}
                      style={styles.gradBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    >
                      {loading ? (
                        <>
                          <ActivityIndicator color="#fff" style={{ marginRight: 10 }} />
                          <Text style={styles.translateBtnText}>{loadingMsg || 'PROCESSING...'}</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="language" size={22} color="#fff" style={{ marginRight: 10 }} />
                          <Text style={styles.translateBtnText}>TRANSLATE TO {targetLang.toUpperCase()}</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* ── Step 3: Results ── */}
          {step === 3 && image && (
            <View style={styles.stepContainer}>
              {translatedText ? (
                <View style={[styles.resultCard, styles.translationCard]}>
                  <View style={styles.cardHeader}>
                    <View style={styles.headerRow}>
                      <Ionicons name="language" size={20} color="#10b981" />
                      <Text style={[styles.cardTitle, { color: '#10b981' }]}>
                        Translation ({ALL_LANGS.find(l => l.name === targetLang)?.native})
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => copyText(translatedText)} style={styles.copyBtn}>
                      <Ionicons name="copy-outline" size={20} color="#10b981" />
                    </TouchableOpacity>
                  </View>
                  {loading ? (
                    <ActivityIndicator color="#10b981" size="large" style={{ marginVertical: 20 }} />
                  ) : (
                    <Text style={styles.translatedText}>{translatedText}</Text>
                  )}
                </View>
              ) : null}

              <View style={styles.resultCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.headerRow}>
                    <Ionicons name="document-text" size={20} color="#a78bfa" />
                    <Text style={styles.cardTitle}>Original Text</Text>
                  </View>
                  <TouchableOpacity onPress={() => copyText(extractedText)} style={styles.copyBtn}>
                    <Ionicons name="copy-outline" size={20} color="#a78bfa" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.resultText}>{extractedText}</Text>
              </View>

              <Text style={styles.retranslateTitle}>Translate to another language:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.retranslateScroll}>
                <View style={styles.retranslateRow}>
                  {ALL_LANGS.map((lang) => (
                    <TouchableOpacity
                      key={lang.name}
                      style={[styles.reChip, targetLang === lang.name && styles.reChipActive]}
                      onPress={() => retranslate(lang.name)}
                      disabled={loading}
                    >
                      <Text style={[styles.reChipText, targetLang === lang.name && styles.reChipTextActive]}>
                        {lang.native}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <TouchableOpacity style={styles.newScanWrap} onPress={reset}>
                <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.gradBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name="scan" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.actionBtnText}>Start New Scan</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}
