// screens/ImageTranslatorScreen.js - OCR.space + OpenRouter Translation
import React, { useState } from 'react';
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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';

// Free OCR.space API key
const OCR_API_KEY = 'K85864488288957';

// OpenRouter API
const OPENROUTER_API_KEY = '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';
const OPENROUTER_MODEL = 'openai/gpt-oss-120b:free';

// All major Indian languages + English
const LANGUAGES = [
  { name: 'English',    native: 'English' },
  { name: 'Hindi',      native: 'हिंदी' },
  { name: 'Bengali',    native: 'বাংলা' },
  { name: 'Telugu',     native: 'తెలుగు' },
  { name: 'Marathi',    native: 'मराठी' },
  { name: 'Tamil',      native: 'தமிழ்' },
  { name: 'Urdu',       native: 'اردو' },
  { name: 'Gujarati',   native: 'ગુજરાતી' },
  { name: 'Kannada',    native: 'ಕನ್ನಡ' },
  { name: 'Malayalam',  native: 'മലയാളം' },
  { name: 'Odia',       native: 'ଓଡ଼ିଆ' },
  { name: 'Punjabi',    native: 'ਪੰਜਾਬੀ' },
  { name: 'Assamese',   native: 'অসমীয়া' },
];

// Helper: convert image URI to base64
const uriToBase64 = async (uri) => {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return base64;
};

const { width } = Dimensions.get('window');

export default function ImageTranslatorScreen() {
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [targetLang, setTargetLang] = useState('Hindi');
  // step: 1=pick image, 2=choose language/preview, 3=result
  const [step, setStep] = useState(1);

  const handleImageResult = async (result) => {
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
  };

  // Image Picker options:
  // Removed aspect ratio to allow a fully resizable crop box and zoom/pan functionality natively.
  const pickOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.8,
    base64: true,
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to take photos.');
      return;
    }
    let result = await ImagePicker.launchCameraAsync(pickOptions);
    await handleImageResult(result);
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Gallery access is required to pick photos.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync(pickOptions);
    await handleImageResult(result);
  };

  const extractTextFromImage = async () => {
    if (!imageBase64) return null;
    setLoadingMessage('Extracting text from image...');
    try {
      const formData = new FormData();
      formData.append('base64Image', `data:image/jpeg;base64,${imageBase64}`);
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'false');
      formData.append('OCREngine', '2');

      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: { 'apikey': OCR_API_KEY },
        body: formData,
      });

      const result = await response.json();
      if (result.IsErroredOnProcessing) {
        console.log('OCR Error:', result.ErrorMessage);
        return null;
      }
      if (result.ParsedResults && result.ParsedResults.length > 0) {
        const text = result.ParsedResults.map(r => r.ParsedText).join('\n').trim();
        if (text) return text;
      }
      return null;
    } catch (error) {
      console.log('OCR fetch error:', error);
      return null;
    }
  };

  const translateWithOpenRouter = async (text, lang) => {
    setLoadingMessage(`Translating to ${lang}...`);
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
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
      });

      const result = await response.json();
      if (result.error) return null;
      if (result.choices && result.choices[0] && result.choices[0].message) {
        return result.choices[0].message.content.trim();
      }
      return null;
    } catch (error) {
      console.log('Translation error:', error);
      return null;
    }
  };

  const extractAndTranslate = async () => {
    setLoading(true);
    setExtractedText('');
    setTranslatedText('');

    const text = await extractTextFromImage();
    if (!text) {
      Alert.alert('No text found', 'Could not extract any text from the image. Try a clearer image with visible text.');
      setLoading(false);
      return;
    }
    setExtractedText(text);

    const translation = await translateWithOpenRouter(text, targetLang);
    if (translation) {
      setTranslatedText(translation);
    } else {
      setTranslatedText('Translation failed. Please try again.');
    }

    setLoading(false);
    setLoadingMessage('');
    setStep(3);
  };

  const retranslate = async (newLang) => {
    if (!extractedText || extractedText === 'No text found in image.') return;
    setTargetLang(newLang);
    setLoading(true);
    setLoadingMessage(`Translating to ${newLang}...`);

    const translation = await translateWithOpenRouter(extractedText, newLang);
    if (translation) {
      setTranslatedText(translation);
    } else {
      setTranslatedText('Translation failed. Please try again.');
    }

    setLoading(false);
    setLoadingMessage('');
  };

  const copyToClipboard = async (text) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied!', 'Text copied to clipboard successfully.');
  };

  const reset = () => {
    setImage(null);
    setImageBase64(null);
    setExtractedText('');
    setTranslatedText('');
    setLoadingMessage('');
    setStep(1);
  };

  return (
    <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Image Translator</Text>
          <Text style={styles.subtitle}>
            {step === 1 && '📸 Capture or pick an image to translate'}
            {step === 2 && '🌐 Preview & select target language'}
            {step === 3 && '🎉 Translation complete!'}
          </Text>
        </View>

        {/* ═══════ Step 1: Pick image ═══════ */}
        {step === 1 && (
          <View style={styles.pickContainer}>
            <View style={styles.pickCard}>
              <View style={styles.iconCircle}>
                <Ionicons name="scan-outline" size={50} color="#38bdf8" />
              </View>
              <Text style={styles.pickTitle}>Scan & Translate</Text>
              <Text style={styles.pickDesc}>
                Instantly extract and translate text from any image using AI.
              </Text>

              <TouchableOpacity style={styles.cameraButton} onPress={pickFromCamera}>
                <LinearGradient colors={['#38bdf8', '#0ea5e9']} style={styles.gradientButton} start={{x: 0, y: 0}} end={{x: 1, y: 1}}>
                  <Ionicons name="camera" size={24} color="#fff" />
                  <Text style={styles.bigButtonText}>Take a Picture</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.galleryButton} onPress={pickFromGallery}>
                <View style={styles.outlineButton}>
                  <Ionicons name="images" size={24} color="#38bdf8" />
                  <Text style={styles.outlineButtonText}>Choose from Gallery</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ═══════ Step 2: Image preview + Language selection ═══════ */}
        {step === 2 && image && (
          <View style={styles.stepContainer}>
            <View style={styles.previewCard}>
              <Image source={{ uri: image }} style={styles.imagePreview} resizeMode="contain" />
              <TouchableOpacity style={styles.repickBtn} onPress={reset}>
                <Ionicons name="refresh" size={18} color="#fff" />
                <Text style={styles.repickBtnText}>Retake / Reselect</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Translate To</Text>

            <View style={styles.langGrid}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.name}
                  style={[
                    styles.langChip,
                    targetLang === lang.name && styles.langChipActive,
                  ]}
                  onPress={() => setTargetLang(lang.name)}
                >
                  <Text style={[styles.langChipText, targetLang === lang.name && styles.langChipTextActive]}>
                    {lang.native}
                  </Text>
                  <Text style={[styles.langChipSubtext, targetLang === lang.name && styles.langChipSubtextActive]}>
                    {lang.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.translateWrapper, loading && styles.disabled]}
              onPress={extractAndTranslate}
              disabled={loading}
            >
              <LinearGradient colors={loading ? ['#475569', '#334155'] : ['#38bdf8', '#0ea5e9']} style={styles.gradientButton} start={{x: 0, y: 0}} end={{x: 1, y: 1}}>
                {loading ? (
                  <>
                    <ActivityIndicator color="#fff" style={{ marginRight: 10 }} />
                    <Text style={styles.translateBtnText}>{loadingMessage || 'PROCESSING...'}</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="language" size={24} color="#fff" style={{ marginRight: 10 }} />
                    <Text style={styles.translateBtnText}>TRANSLATE TO {targetLang.toUpperCase()}</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* ═══════ Step 3: Results ═══════ */}
        {step === 3 && image && (
          <View style={styles.stepContainer}>
            {/* Translated Text Card (Primary Focus) */}
            {translatedText ? (
              <View style={[styles.resultCard, styles.translationCard]}>
                <View style={styles.cardHeader}>
                  <View style={styles.headerTitleRow}>
                    <Ionicons name="language" size={22} color="#10b981" />
                    <Text style={[styles.cardTitle, { color: '#10b981' }]}>
                      Translation ({LANGUAGES.find(l => l.name === targetLang)?.native})
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => copyToClipboard(translatedText)} style={styles.copyBtn}>
                    <Ionicons name="copy-outline" size={22} color="#10b981" />
                  </TouchableOpacity>
                </View>
                {loading ? (
                  <ActivityIndicator color="#10b981" size="large" style={{ marginVertical: 20 }} />
                ) : (
                  <Text style={styles.translatedResultText}>{translatedText}</Text>
                )}
              </View>
            ) : null}

            {/* Original Extracted Text Card */}
            <View style={styles.resultCard}>
              <View style={styles.cardHeader}>
                <View style={styles.headerTitleRow}>
                  <Ionicons name="document-text" size={22} color="#38bdf8" />
                  <Text style={styles.cardTitle}>Original Text</Text>
                </View>
                <TouchableOpacity onPress={() => copyToClipboard(extractedText)} style={styles.copyBtn}>
                  <Ionicons name="copy-outline" size={22} color="#38bdf8" />
                </TouchableOpacity>
              </View>
              <Text style={styles.resultText}>{extractedText}</Text>
            </View>

            {/* Try Another Language */}
            <Text style={styles.retranslateTitle}>Translate to another language:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.retranslateScroll}>
              <View style={styles.retranslateRow}>
                {LANGUAGES.map((lang) => (
                  <TouchableOpacity
                    key={lang.name}
                    style={[styles.retranslateChip, targetLang === lang.name && styles.retranslateChipActive]}
                    onPress={() => retranslate(lang.name)}
                    disabled={loading}
                  >
                    <Text style={[styles.retranslateText, targetLang === lang.name && styles.retranslateTextActive]}>
                      {lang.native}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Action buttons */}
            <TouchableOpacity style={styles.newScanWrapper} onPress={reset}>
               <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.gradientButton} start={{x: 0, y: 0}} end={{x: 1, y: 1}}>
                <Ionicons name="scan" size={22} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.actionBtnText}>Start New Scan</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },

  // ── Common ──
  stepContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 20,
    width: '100%',
  },

  // ── Step 1 ──
  pickContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  pickCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 28,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  pickTitle: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
  },
  pickDesc: {
    color: '#94a3b8',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  cameraButton: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 20,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  galleryButton: {
    width: '100%',
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    backgroundColor: 'transparent',
  },
  outlineButtonText: {
    color: '#38bdf8',
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 10,
  },
  bigButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 10,
  },

  // ── Step 2 ──
  previewCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 24,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  imagePreview: {
    width: '100%',
    height: 250,
    borderRadius: 16,
  },
  repickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  repickBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    marginLeft: 4,
  },
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 30,
  },
  langChip: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    width: (width - 60) / 3, // 3 columns
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  langChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38bdf8',
  },
  langChipText: {
    color: '#cbd5e1',
    fontSize: 16,
    fontWeight: '600',
  },
  langChipTextActive: {
    color: '#38bdf8',
  },
  langChipSubtext: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 4,
  },
  langChipSubtextActive: {
    color: '#7dd3fc',
  },
  translateWrapper: {
    width: '100%',
    borderRadius: 20,
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  translateBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  disabled: {
    opacity: 0.8,
    shadowOpacity: 0,
    elevation: 0,
  },

  // ── Step 3 ──
  resultCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  translationCard: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  copyBtn: {
    padding: 4,
  },
  resultText: {
    color: '#e2e8f0',
    fontSize: 16,
    lineHeight: 26,
  },
  translatedResultText: {
    color: '#fff',
    fontSize: 19,
    lineHeight: 30,
    fontWeight: '500',
  },
  retranslateTitle: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  retranslateScroll: {
    marginBottom: 24,
  },
  retranslateRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 4,
  },
  retranslateChip: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  retranslateChipActive: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8',
  },
  retranslateText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '500',
  },
  retranslateTextActive: {
    color: '#0f172a',
    fontWeight: '700',
  },
  newScanWrapper: {
    width: '100%',
    borderRadius: 20,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
