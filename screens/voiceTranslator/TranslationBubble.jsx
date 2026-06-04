// voiceTranslator/TranslationBubble.jsx
// Single chat bubble showing original text, translated text, language tags, timestamp, and TTS button

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getLangByCode } from './translatorConstants';
import STRINGS from './strings';

function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

export default function TranslationBubble({
  entry,
  onSpeak,
  onRetry,
  isSpeakingThis,
}) {
  const sourceLangData = getLangByCode(entry.sourceLang);
  const targetLangData = getLangByCode(entry.targetLang);
  const isLowConfidence = entry.confidence < 0.6;
  const hasFailed = !!entry.error;
  const isTranslating = !entry.translatedText && !entry.error;
  const isTranslationSameAsSource =
    entry.translatedText &&
    entry.translatedText.trim().toLowerCase() === entry.originalText?.trim().toLowerCase();

  return (
    <View style={styles.container}>
      {/* Original text bubble */}
      <View style={styles.originalBubble}>
        <View style={styles.bubbleHeader}>
          <View style={styles.langTag}>
            <Text style={styles.langTagText}>
              {sourceLangData.flag} {sourceLangData.shortCode.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.timestamp}>{formatTime(entry.timestamp)}</Text>
        </View>
        <Text style={styles.originalText}>{entry.originalText}</Text>
        {isLowConfidence && (
          <TouchableOpacity style={styles.lowConfidenceBadge} onPress={onRetry}>
            <Ionicons name="warning" size={12} color="#D4780A" />
            <Text style={styles.lowConfidenceText}>{STRINGS.LOW_CONFIDENCE}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Arrow indicator */}
      <View style={styles.arrowContainer}>
        <View style={styles.langFlow}>
          <Text style={styles.langFlowText}>
            {sourceLangData.shortCode.toUpperCase()} → {targetLangData.shortCode.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Translated text bubble */}
      <View style={styles.translatedBubble}>
        {isTranslating ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.loadingText}>{STRINGS.TRANSLATING}</Text>
          </View>
        ) : hasFailed ? (
          <TouchableOpacity style={styles.errorContainer} onPress={onRetry}>
            <Ionicons name="alert-circle" size={18} color="#FF6B6B" />
            <Text style={styles.errorText}>{entry.error}</Text>
            <View style={styles.retryChip}>
              <Ionicons name="refresh" size={14} color="#FFFFFF" />
              <Text style={styles.retryText}>Retry</Text>
            </View>
          </TouchableOpacity>
        ) : isTranslationSameAsSource ? (
          <TouchableOpacity style={styles.translationError} onPress={onRetry}>
            <Text style={styles.translationErrorText}>
              ⚠️ Translation unavailable. Tap to retry.
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            <View style={styles.translatedHeader}>
              <View style={styles.langTagDark}>
                <Text style={styles.langTagDarkText}>
                  {targetLangData.flag} {targetLangData.shortCode.toUpperCase()}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.speakerButton, isSpeakingThis && styles.speakerButtonActive]}
                onPress={() => onSpeak(entry.translatedText, entry.targetLang, entry.id)}
                accessibilityLabel={STRINGS.SPEAK_TRANSLATION}
              >
                <Ionicons
                  name={isSpeakingThis ? 'volume-high' : 'volume-medium'}
                  size={18}
                  color={isSpeakingThis ? '#E8622A' : '#FFFFFF'}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.translatedText}>{entry.translatedText}</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },

  // Original (user) bubble
  originalBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderTopLeftRadius: 4,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  bubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  langTag: {
    backgroundColor: '#F5F2ED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  langTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7A7A7A',
  },
  timestamp: {
    fontSize: 11,
    color: '#B0A99D',
  },
  originalText: {
    fontSize: 15,
    color: '#1A1A1A',
    lineHeight: 22,
  },

  // Low confidence badge
  lowConfidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E8',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 8,
    gap: 4,
  },
  lowConfidenceText: {
    fontSize: 11,
    color: '#D4780A',
    fontWeight: '500',
  },

  // Arrow
  arrowContainer: {
    alignItems: 'flex-end',
    paddingVertical: 4,
    paddingRight: 12,
  },
  langFlow: {
    backgroundColor: '#F0ECE6',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  langFlowText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7A7A7A',
    letterSpacing: 0.5,
  },

  // Translated bubble
  translatedBubble: {
    backgroundColor: '#2C3E6B',
    borderRadius: 18,
    borderTopRightRadius: 4,
    padding: 14,
    shadowColor: '#2C3E6B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  translatedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  langTagDark: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  langTagDarkText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  translatedText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    lineHeight: 24,
  },

  // Speaker button
  speakerButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakerButtonActive: {
    backgroundColor: 'rgba(232,98,42,0.2)',
    borderWidth: 1.5,
    borderColor: '#E8622A',
  },

  // Loading state
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },

  // Error state
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  errorText: {
    color: '#FF9A9A',
    fontSize: 13,
    flex: 1,
  },
  retryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  translationError: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
  },
  translationErrorText: {
    color: '#FF3B30',
    fontSize: 13,
  },
});
