// screens/ImageTranslatorScreen.js - OpenAI Vision OCR + Translation
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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';

// OpenAI API Key
const OPENAI_API_KEY = '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';

const LANGUAGES = [
  { name: 'Hindi',      native: 'हिंदी' },
  { name: 'Tamil',      native: 'தமிழ்' },
  { name: 'Telugu',     native: 'తెలుగు' },
  { name: 'Kannada',    native: 'ಕನ್ನಡ' },
  { name: 'Malayalam',  native: 'മലയാളം' },
  { name: 'French',     native: 'Français' },
  { name: 'Spanish',    native: 'Español' },
  { name: 'German',     native: 'Deutsch' },
  { name: 'Japanese',   native: '日本語' },
  { name: 'Korean',     native: '한국어' },
  { name: 'Chinese',    native: '中文' },
  { name: 'Arabic',     native: 'العربية' },
  { name: 'Portuguese', native: 'Português' },
  { name: 'Russian',    native: 'Русский' },
  { name: 'English',    native: 'English' },
];

// Helper: convert image URI to base64
const uriToBase64 = async (uri) => {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return base64;
};

export default function ImageTranslatorScreen() {
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [targetLang, setTargetLang] = useState('Hindi');
  // step: 1=pick image, 2=choose language, 3=result
  const [step, setStep] = useState(1);

  // ── Handle image result from camera or gallery ──
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
        // Go directly to language selection
        setStep(2);
      } else {
        Alert.alert('Error', 'Could not read image data. Please try again.');
      }
    }
  };

  // ── Pick from camera ──
  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to take photos.');
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });
    await handleImageResult(result);
  };

  // ── Pick from gallery ──
  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Gallery access is required to pick photos.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });
    await handleImageResult(result);
  };

  // ── Extract text AND translate in one call using OpenAI ──
  const extractAndTranslate = async () => {
    if (!imageBase64) {
      Alert.alert('Error', 'No image data available.');
      return;
    }

    setLoading(true);
    setExtractedText('');
    setTranslatedText('');

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are an image text extractor and translator. 
When given an image:
1. Extract ALL visible text from the image exactly as it appears.
2. Translate the extracted text into ${targetLang}.

Respond in EXACTLY this JSON format and nothing else:
{"extracted": "the original text from the image", "translated": "the translated text in ${targetLang}"}

If there is no readable text in the image, respond with:
{"extracted": "No text found in image.", "translated": ""}`,
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Extract the text from this image and translate it to ${targetLang}.`,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                    detail: 'high',
                  },
                },
              ],
            },
          ],
          max_tokens: 2000,
        }),
      });

      const result = await response.json();

      if (result.error) {
        console.log('OpenAI error:', JSON.stringify(result.error));
        Alert.alert('API Error', result.error.message || 'Something went wrong.');
        setLoading(false);
        return;
      }

      if (result.choices && result.choices[0] && result.choices[0].message) {
        const content = result.choices[0].message.content.trim();

        try {
          // Remove markdown code fences if present
          let jsonStr = content;
          if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
          }
          const parsed = JSON.parse(jsonStr);
          setExtractedText(parsed.extracted || 'No text found.');
          setTranslatedText(parsed.translated || '');
          setStep(3);
        } catch (parseErr) {
          // If JSON parsing fails, treat the whole response as extracted text
          console.log('JSON parse failed, using raw response');
          setExtractedText(content);
          setTranslatedText('');
          setStep(3);
        }
      } else {
        Alert.alert('Error', 'Unexpected response from API.');
      }
    } catch (error) {
      console.log('Error:', error.message || error);
      Alert.alert('Network Error', error.message || 'Check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  // ── Re-translate to a different language ──
  const retranslate = async (newLang) => {
    if (!extractedText || extractedText === 'No text found in image.') return;

    setTargetLang(newLang);
    setLoading(true);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Translate the following text to ${newLang}. Return ONLY the translated text, nothing else.`,
            },
            {
              role: 'user',
              content: extractedText,
            },
          ],
          max_tokens: 1000,
        }),
      });

      const result = await response.json();

      if (result.choices && result.choices[0] && result.choices[0].message) {
        setTranslatedText(result.choices[0].message.content.trim());
      }
    } catch (error) {
      console.log('Re-translation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setImageBase64(null);
    setExtractedText('');
    setTranslatedText('');
    setTargetLang('Hindi');
    setStep(1);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Image Translator</Text>
        <Text style={styles.subtitle}>
          {step === 1 && '📸 Take a picture or choose from gallery'}
          {step === 2 && '🌐 Select a language to translate'}
          {step === 3 && '🎉 Translation complete!'}
        </Text>
      </View>

      {/* ═══════ Step 1: Pick image ═══════ */}
      {step === 1 && (
        <View style={styles.pickContainer}>
          <View style={styles.pickCard}>
            <Ionicons name="scan-outline" size={80} color="#ff7a45" />
            <Text style={styles.pickTitle}>Scan & Translate</Text>
            <Text style={styles.pickDesc}>
              Take a photo or pick an image to extract and translate text
            </Text>

            <TouchableOpacity style={styles.cameraButton} onPress={pickFromCamera}>
              <Ionicons name="camera" size={28} color="#fff" />
              <Text style={styles.bigButtonText}>Take a Picture</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.galleryButton} onPress={pickFromGallery}>
              <Ionicons name="images" size={28} color="#fff" />
              <Text style={styles.bigButtonText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ═══════ Step 2: Image preview + Language selection ═══════ */}
      {step === 2 && image && (
        <View style={styles.step2Container}>
          {/* Image preview */}
          <Image source={{ uri: image }} style={styles.imagePreview} />

          {/* Language selection */}
          <Text style={styles.sectionTitle}>
            Which language do you want to translate to?
          </Text>

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
                <Text
                  style={[
                    styles.langChipText,
                    targetLang === lang.name && styles.langChipTextActive,
                  ]}
                >
                  {lang.native}
                </Text>
                <Text
                  style={[
                    styles.langChipSubtext,
                    targetLang === lang.name && styles.langChipSubtextActive,
                  ]}
                >
                  {lang.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Translate button */}
          <TouchableOpacity
            style={[styles.translateBtn, loading && styles.disabled]}
            onPress={extractAndTranslate}
            disabled={loading}
          >
            {loading ? (
              <>
                <ActivityIndicator color="#fff" />
                <Text style={styles.translateBtnText}>EXTRACTING & TRANSLATING...</Text>
              </>
            ) : (
              <>
                <Ionicons name="language" size={24} color="#fff" />
                <Text style={styles.translateBtnText}>
                  TRANSLATE TO {targetLang.toUpperCase()}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={reset}>
            <Ionicons name="arrow-back" size={18} color="#b0b4c3" />
            <Text style={styles.backBtnText}>Choose different image</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ═══════ Step 3: Results ═══════ */}
      {step === 3 && image && (
        <View style={styles.resultContainer}>
          {/* Small image preview */}
          <Image source={{ uri: image }} style={styles.resultImage} />

          {/* Extracted Text */}
          <View style={styles.resultCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="document-text" size={20} color="#ff7a45" />
              <Text style={styles.cardTitle}>Original Text</Text>
            </View>
            <Text style={styles.resultText}>{extractedText}</Text>
          </View>

          {/* Translated Text */}
          {translatedText ? (
            <View style={[styles.resultCard, styles.translationCard]}>
              <View style={styles.cardHeader}>
                <Ionicons name="language" size={20} color="#4CAF50" />
                <Text style={[styles.cardTitle, { color: '#4CAF50' }]}>
                  Translation ({LANGUAGES.find(l => l.name === targetLang)?.native})
                </Text>
              </View>
              {loading ? (
                <ActivityIndicator color="#4CAF50" style={{ marginVertical: 16 }} />
              ) : (
                <Text style={styles.translatedResultText}>{translatedText}</Text>
              )}
            </View>
          ) : null}

          {/* Re-translate to different language */}
          <Text style={styles.retranslateTitle}>Try another language:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.retranslateScroll}>
            <View style={styles.retranslateRow}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.name}
                  style={[
                    styles.retranslateChip,
                    targetLang === lang.name && styles.retranslateChipActive,
                  ]}
                  onPress={() => retranslate(lang.name)}
                >
                  <Text
                    style={[
                      styles.retranslateText,
                      targetLang === lang.name && styles.retranslateTextActive,
                    ]}
                  >
                    {lang.native}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Action buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => {
                Alert.alert('Copied!', 'Translated text copied to clipboard');
              }}
            >
              <Ionicons name="copy" size={20} color="#fff" />
              <Text style={styles.actionBtnText}>Copy</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, styles.newScanBtn]} onPress={reset}>
              <Ionicons name="camera" size={20} color="#fff" />
              <Text style={styles.actionBtnText}>New Scan</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050b18' },
  header: {
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
  },
  subtitle: {
    color: '#b0b4c3',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },

  // ── Step 1 ──
  pickContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pickCard: {
    backgroundColor: '#161b2b',
    borderRadius: 28,
    padding: 40,
    alignItems: 'center',
    width: '100%',
  },
  pickTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 24,
    marginBottom: 8,
  },
  pickDesc: {
    color: '#b0b4c3',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  cameraButton: {
    flexDirection: 'row',
    backgroundColor: '#ff7a45',
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  galleryButton: {
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: 'center',
    width: '100%',
  },
  bigButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 16,
  },

  // ── Step 2 ──
  step2Container: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
  },
  imagePreview: {
    width: '100%',
    height: 220,
    borderRadius: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  langChip: {
    backgroundColor: '#1f2740',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    minWidth: 90,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  langChipActive: {
    backgroundColor: '#ff7a4525',
    borderColor: '#ff7a45',
  },
  langChipText: {
    color: '#d0d3e0',
    fontSize: 16,
    fontWeight: '600',
  },
  langChipTextActive: {
    color: '#ff7a45',
  },
  langChipSubtext: {
    color: '#666',
    fontSize: 11,
    marginTop: 2,
  },
  langChipSubtextActive: {
    color: '#ff9a75',
  },
  translateBtn: {
    flexDirection: 'row',
    backgroundColor: '#ff7a45',
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 16,
  },
  translateBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 12,
  },
  disabled: {
    backgroundColor: '#555',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  backBtnText: {
    color: '#b0b4c3',
    fontSize: 14,
    marginLeft: 8,
  },

  // ── Step 3 ──
  resultContainer: {
    flex: 1,
    padding: 24,
  },
  resultImage: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    marginBottom: 20,
  },
  resultCard: {
    backgroundColor: '#161b2b',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  translationCard: {
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    color: '#ff7a45',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  resultText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 26,
  },
  translatedResultText: {
    color: '#c8ffc8',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '500',
  },

  retranslateTitle: {
    color: '#b0b4c3',
    fontSize: 14,
    marginBottom: 10,
  },
  retranslateScroll: {
    marginBottom: 20,
  },
  retranslateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  retranslateChip: {
    backgroundColor: '#1f2740',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  retranslateChipActive: {
    backgroundColor: '#ff7a45',
  },
  retranslateText: {
    color: '#d0d3e0',
    fontSize: 13,
  },
  retranslateTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  actionsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newScanBtn: {
    backgroundColor: '#ff7a45',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
});
