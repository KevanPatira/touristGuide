// screens/VoiceTranslatorScreen.js
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../constants/ThemeContext';

import GlassCard from '../components/ui/GlassCard';
import PressableGoldButton from '../components/ui/PressableGoldButton';
import StaggerRevealText from '../components/ui/StaggerRevealText';
import FloatingParticles from '../components/ui/FloatingParticles';

const FAKE_LANGUAGES = {
  'English': { code: 'en', native: 'English' },
  'Hindi': { code: 'hi', native: 'हिंदी' },
  'French': { code: 'fr', native: 'Français' },
  'Spanish': { code: 'es', native: 'Español' },
  'German': { code: 'de', native: 'Deutsch' },
};

// Fake speech recognition results
const FAKE_SPEECH = [
  'Hello, how are you?',
  'Where is the nearest restaurant?',
  'Can you help me find the train station?',
  'What time does the museum close?',
  'नमस्ते, आप कैसे हैं?', // Hindi
  'Bonjour, où est la gare?', // French
];

function LanguagePicker({ selectedLang, onLangChange, label }) {
  const { theme } = useTheme();
  return (
    <View style={styles.langPicker}>
      <Text style={[theme.typography.body, styles.pickerLabel, { color: theme.colors.ivory }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.langRow}>
          {Object.entries(FAKE_LANGUAGES).map(([name, data]) => {
            const isActive = selectedLang === name;
            return (
              <TouchableOpacity
                key={name}
                style={[
                  styles.langButton,
                  { borderColor: isActive ? theme.colors.gold : theme.colors.borderSilver },
                  isActive && { backgroundColor: theme.colors.gold }
                ]}
                onPress={() => onLangChange(name)}
              >
                <Text
                  style={[
                    theme.typography.label,
                    { color: isActive ? theme.colors.obsidian : theme.colors.parchment }
                  ]}
                >
                  {data.native}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function ListeningAnimation() {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.micContainer,
        {
          transform: [{ scale: scaleAnim }],
          opacity: pulseAnim,
        },
      ]}
    >
      <Ionicons name="mic" size={60} color={theme.colors.gold} />
      <View style={styles.soundWaves}>
        <View style={[styles.wave, styles.wave1, { backgroundColor: theme.colors.gold + '66' }]} />
        <View style={[styles.wave, styles.wave2, { backgroundColor: theme.colors.gold + '66' }]} />
        <View style={[styles.wave, styles.wave3, { backgroundColor: theme.colors.gold + '66' }]} />
      </View>
    </Animated.View>
  );
}

export default function VoiceTranslatorScreen() {
  const { theme } = useTheme();
  const [status, setStatus] = useState('idle'); // idle, listening, processing, result
  const [detectedSpeech, setDetectedSpeech] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [fromLang, setFromLang] = useState('English');
  const [toLang, setToLang] = useState('Hindi');

  const handleRecord = () => {
    setStatus('listening');
    
    // Simulate speech recognition after 2 seconds
    setTimeout(() => {
      const fakeText = FAKE_SPEECH[Math.floor(Math.random() * FAKE_SPEECH.length)];
      setDetectedSpeech(fakeText);
      setStatus('processing');
    }, 2000);
  };

  const handleProcess = () => {
    // Simulate translation after 1.5 seconds
    setTimeout(() => {
      // Fake translations based on detected speech
      const translations = {
        'Hello, how are you?': { hi: 'नमस्ते, आप कैसे हैं?', fr: 'Bonjour, comment allez-vous?' },
        'Where is the nearest restaurant?': { hi: 'निकटतम रेस्तरां कहाँ है?', fr: 'Où est le restaurant le plus proche?' },
        'Can you help me find the train station?': { hi: 'क्या आप मुझे ट्रेन स्टेशन ढूंढने में मदद कर सकते हैं?', fr: 'Pouvez-vous m\'aider à trouver la gare?' },
        'नमस्ते, आप कैसे हैं?': { en: 'Hello, how are you?', fr: 'Bonjour, comment allez-vous?' },
        'Bonjour, où est la gare?': { en: 'Hello, where is the train station?', hi: 'नमस्ते, ट्रेन स्टेशन कहाँ है?' },
      };
      
      const translation = translations[detectedSpeech]?.[toLang] || detectedSpeech;
      setTranslatedText(translation);
      setStatus('result');
    }, 1500);
  };

  const handleNewRecording = () => {
    setStatus('idle');
    setDetectedSpeech('');
    setTranslatedText('');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.obsidian }]}>
      <FloatingParticles count={10} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.midnight }]}>
        <StaggerRevealText text="Voice Translator" style={[theme.typography.displayS, { color: theme.colors.gold }]} />
        <Text style={[theme.typography.caption, { color: theme.colors.parchment, marginTop: 4 }]}>
          Speak in one language, hear it in another
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main content */}
        <View style={styles.mainContent}>
          {/* Listening/Recording area */}
          {status === 'idle' && (
            <View style={styles.idleArea}>
              <Ionicons name="mic-outline" size={100} color={theme.colors.parchment} />
              <Text style={[theme.typography.body, styles.idleText, { color: theme.colors.ivory }]}>Tap microphone to start speaking</Text>
            </View>
          )}

          {status === 'listening' && (
            <View style={styles.listeningArea}>
              <ListeningAnimation />
              <Text style={[theme.typography.headingM, styles.listeningText, { color: theme.colors.ivory, marginTop: 40 }]}>Listening...</Text>
              <Text style={[theme.typography.caption, styles.statusText, { color: theme.colors.parchment }]}>2 seconds remaining</Text>
            </View>
          )}

          {status === 'processing' && (
            <View style={styles.processingArea}>
              <Ionicons name="hourglass" size={48} color={theme.colors.gold} />
              <Text style={[theme.typography.headingM, styles.processingText, { color: theme.colors.ivory, marginTop: 16 }]}>Processing speech...</Text>
              <Text style={[theme.typography.body, styles.detectedText, { color: theme.colors.gold, marginTop: 12 }]}>{detectedSpeech}</Text>
            </View>
          )}

          {status === 'result' && (
            <View style={styles.resultArea}>
              {/* Detected speech */}
              <GlassCard style={styles.speechCard} glowOnPress={false}>
                <Text style={[theme.typography.caption, styles.cardTitle, { color: theme.colors.parchment }]}>You said:</Text>
                <Text style={[theme.typography.body, styles.speechText, { color: theme.colors.ivory }]}>{detectedSpeech}</Text>
              </GlassCard>

              {/* Language picker */}
              <LanguagePicker
                selectedLang={toLang}
                onLangChange={setToLang}
                label="Translate to:"
              />

              {/* Translation */}
              <GlassCard style={styles.translationCard} glowOnPress={false}>
                <Text style={[theme.typography.caption, styles.cardTitle, { color: theme.colors.parchment }]}>Translation:</Text>
                <TouchableOpacity style={styles.playButton}>
                  <Ionicons name="play" size={20} color={theme.colors.gold} />
                  <Text style={[theme.typography.headingM, styles.translatedText, { color: theme.colors.gold }]}>{translatedText}</Text>
                </TouchableOpacity>
              </GlassCard>
            </View>
          )}

          {/* Action buttons */}
          {status !== 'idle' && (
            <View style={styles.actionRow}>
              <PressableGoldButton 
                label="New Recording" 
                onPress={handleNewRecording}
                variant="outline"
                style={{ flex: 1, marginRight: 8 }}
              />
              
              {status === 'listening' && (
                <TouchableOpacity style={[styles.stopButton, { backgroundColor: theme.colors.crimson }]} onPress={() => setStatus('idle')}>
                  <Text style={[theme.typography.label, { color: theme.colors.ivory }]}>Stop</Text>
                </TouchableOpacity>
              )}
              
              {status === 'processing' && (
                <PressableGoldButton 
                  label="Translate" 
                  onPress={handleProcess}
                  style={{ flex: 1, marginLeft: 8 }}
                />
              )}
            </View>
          )}

          {status === 'idle' && (
            <TouchableOpacity style={[styles.recordButton, { backgroundColor: theme.colors.gold }]} onPress={handleRecord}>
              <Ionicons name="mic" size={54} color={theme.colors.obsidian} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    zIndex: 10,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },

  idleArea: {
    alignItems: 'center',
  },
  idleText: {
    marginTop: 16,
    textAlign: 'center',
  },

  listeningArea: {
    alignItems: 'center',
  },
  listeningText: {
    textAlign: 'center',
  },
  statusText: {
    marginTop: 8,
  },

  processingArea: {
    alignItems: 'center',
  },
  processingText: {
    textAlign: 'center',
  },
  detectedText: {
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  resultArea: {
    alignItems: 'center',
    width: '100%',
  },
  speechCard: {
    width: '100%',
    padding: 20,
    marginBottom: 20,
  },
  translationCard: {
    width: '100%',
    padding: 20,
  },
  cardTitle: {
    marginBottom: 8,
  },
  speechText: {
    //
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  translatedText: {
    marginLeft: 12,
  },

  langPicker: {
    width: '100%',
    marginVertical: 16,
    marginBottom: 24,
  },
  pickerLabel: {
    marginBottom: 12,
  },
  langRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  langButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },

  micContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
  },
  soundWaves: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
  },
  wave: {
    position: 'absolute',
    borderRadius: 3,
  },
  wave1: {
    width: 4,
    height: 20,
    left: 10,
  },
  wave2: {
    width: 4,
    height: 30,
    left: 20,
  },
  wave3: {
    width: 4,
    height: 25,
    left: 30,
  },

  recordButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    elevation: 8,
    shadowColor: '#d4af37',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  actionRow: {
    flexDirection: 'row',
    marginTop: 40,
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stopButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 20,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
});
