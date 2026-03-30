// screens/ImageTranslatorScreen.js - Google Vision OCR
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

// REPLACE WITH YOUR GOOGLE VISION API KEY
const GOOGLE_VISION_KEY = '';

// Helper: convert image URI to base64 using expo-file-system
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
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Handle image result from either picker
  const handleImageResult = async (result) => {
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setImage(asset.uri);

      // Try to get base64 from picker, fallback to FileSystem conversion
      let base64Data = asset.base64;
      if (!base64Data) {
        console.log('base64 not returned by picker, converting via FileSystem...');
        try {
          base64Data = await uriToBase64(asset.uri);
        } catch (err) {
          console.log('FileSystem base64 conversion failed:', err);
        }
      }

      if (base64Data) {
        console.log('Base64 captured, length:', base64Data.length);
        setImageBase64(base64Data);
        setStep(2);
      } else {
        Alert.alert('Error', 'Could not read image data. Please try again.');
      }
    }
  };

  // Pick from camera
  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed for camera');
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

  // Pick from gallery  
  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed for gallery');
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

  // OCR using Google Vision API
  const performOCR = async () => {
    if (!image) return;

    // If base64 is missing, try to re-read from file
    let base64 = imageBase64;
    if (!base64) {
      try {
        base64 = await uriToBase64(image);
        setImageBase64(base64);
      } catch (err) {
        console.log('Failed to read base64:', err);
        setExtractedText('Error: Could not read image data.');
        return;
      }
    }

    try {
      setLoading(true);
      setExtractedText('');

      console.log('Sending to Vision API, base64 length:', base64.length);

      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_KEY}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [{
              image: { content: base64 },
              features: [{ type: 'TEXT_DETECTION', maxResults: 10 }]
            }]
          }),
        }
      );

      const result = await response.json();
      console.log('Vision API status:', response.status);

      // Check for API-level errors (invalid key, quota, etc.)
      if (result.error) {
        console.log('Vision API error:', JSON.stringify(result.error));
        setExtractedText(`API Error: ${result.error.message || 'Unknown error'}`);
        return;
      }
      
      if (result.responses && result.responses[0]) {
        // Check for per-request errors
        if (result.responses[0].error) {
          console.log('Vision request error:', JSON.stringify(result.responses[0].error));
          setExtractedText(`API Error: ${result.responses[0].error.message || 'Request failed'}`);
          return;
        }

        if (result.responses[0].fullTextAnnotation) {
          const text = result.responses[0].fullTextAnnotation.text;
          setExtractedText(text || 'No text found');
          setStep(3);
        } else {
          setExtractedText('No text detected in image. Try a clearer image with visible text.');
        }
      } else {
        console.log('Unexpected API response:', JSON.stringify(result));
        setExtractedText('Unexpected response from API. Check console for details.');
      }
    } catch (error) {
      console.log('OCR Error:', error.message || error);
      setExtractedText(`Network Error: ${error.message || 'Check your internet connection'}`);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setImageBase64(null);
    setExtractedText('');
    setStep(1);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Image Translator</Text>
        <Text style={styles.subtitle}>
          {step === 1 && '📸 Pick or take image'}
          {step === 2 && '✨ Ready to extract text'}
          {step === 3 && '✅ Text extracted!'}
        </Text>
      </View>

      {/* Step 1: Pick */}
      {step === 1 && (
        <View style={styles.pickContainer}>
          <View style={styles.pickCard}>
            <Ionicons name="text-outline" size={80} color="#ff7a45" />
            <Text style={styles.pickTitle}>Scan any text</Text>
            <Text style={styles.pickDesc}>Menus, signs, documents</Text>
            
            <TouchableOpacity style={styles.bigButton} onPress={pickFromCamera}>
              <Ionicons name="camera" size={28} color="#fff" />
              <Text style={styles.bigButtonText}>Camera</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.bigButton} onPress={pickFromGallery}>
              <Ionicons name="image" size={28} color="#fff" />
              <Text style={styles.bigButtonText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Step 2: Preview + OCR */}
      {step === 2 && image && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: image }} style={styles.imagePreview} />
          <Text style={styles.previewText}>Tap to extract text</Text>
          
          <TouchableOpacity 
            style={[styles.ocrButton, loading && styles.disabled]}
            onPress={performOCR}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="text" size={24} color="#fff" />
                <Text style={styles.ocrButtonText}>EXTRACT TEXT</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Step 3: Results */}
      {step === 3 && image && (
        <View style={styles.resultContainer}>
          <Image source={{ uri: image }} style={styles.resultImage} />
          
          <View style={styles.textContainer}>
            <Text style={styles.resultTitle}>Extracted Text:</Text>
            <Text style={styles.extractedText}>{extractedText}</Text>
          </View>
          
          <View style={styles.buttonsRow}>
            <TouchableOpacity style={styles.actionButton} onPress={() => {
              Alert.alert('Copied!', 'Text copied to clipboard');
            }}>
              <Ionicons name="copy" size={20} color="#fff" />
              <Text style={styles.actionText}>Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={reset}>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.actionText}>New Scan</Text>
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
    alignItems: 'center' 
  },
  title: { 
    color: '#fff', 
    fontSize: 32, 
    fontWeight: '800' 
  },
  subtitle: { 
    color: '#b0b4c3', 
    fontSize: 16, 
    marginTop: 8,
    textAlign: 'center'
  },

  pickContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pickCard: {
    backgroundColor: '#161b2b',
    borderRadius: 28,
    padding: 48,
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
    fontSize: 16,
    marginBottom: 32,
  },
  bigButton: {
    flexDirection: 'row',
    backgroundColor: '#ff7a45',
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  bigButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 16,
  },

  previewContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
  },
  imagePreview: {
    width: 320,
    height: 320,
    borderRadius: 24,
    marginBottom: 24,
  },
  previewText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 32,
  },
  ocrButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 24,
    alignItems: 'center',
  },
  ocrButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 12,
  },
  disabled: {
    backgroundColor: '#666',
  },

  resultContainer: {
    flex: 1,
    padding: 24,
  },
  resultImage: {
    width: '100%',
    height: 280,
    borderRadius: 24,
    marginBottom: 24,
  },
  textContainer: {
    backgroundColor: '#161b2b',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    minHeight: 140,
  },
  resultTitle: {
    color: '#ff7a45',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  extractedText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 26,
    fontFamily: 'monospace',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 12,
  },
});
