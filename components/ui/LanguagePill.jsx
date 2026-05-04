// components/ui/LanguagePill.jsx
import React, { useEffect, useRef } from 'react';
import { Text, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../../constants/ThemeContext';

/**
 * A compact pill badge showing a flag and language name.
 * @param {string} language - Language name
 * @param {string} flag - Emoji flag
 * @param {boolean} detected - True if it's the auto-detected language
 */
export default function LanguagePill({ language, flag, detected = false }) {
  const { theme } = useTheme();
  
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Initial mount animation
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        bounciness: 12,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Detect pulse animation
  useEffect(() => {
    if (detected) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [detected]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          borderColor: detected ? theme.colors.emerald : theme.colors.gold,
          backgroundColor: detected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(201, 168, 76, 0.15)',
          opacity: opacityAnim,
          transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }],
        },
      ]}
    >
      <Text style={styles.flag}>{flag}</Text>
      <Text
        style={[
          theme.typography.caption,
          styles.text,
          { color: detected ? theme.colors.emerald : theme.colors.gold },
        ]}
      >
        {language}
        {detected ? ' (Auto)' : ''}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  flag: {
    fontSize: 14,
    marginRight: 6,
  },
  text: {
    fontWeight: '600',
  },
});
