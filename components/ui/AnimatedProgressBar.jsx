// components/ui/AnimatedProgressBar.jsx
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../constants/ThemeContext';

/**
 * Animated progress bar with gradient fill.
 * @param {number} progress - 0 to 1
 * @param {string} label - Text label above the bar
 */
export default function AnimatedProgressBar({ progress = 0, label, style }) {
  const { theme } = useTheme();
  const widthAnim = useRef(new Animated.Value(0)).current;

  // Clamp progress to 0-1
  const safeProgress = Math.min(Math.max(progress, 0), 1);

  useEffect(() => {
    Animated.spring(widthAnim, {
      toValue: safeProgress,
      useNativeDriver: false, // width cannot use native driver
      bounciness: 8,
    }).start();
  }, [safeProgress]);

  const widthInt = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[theme.typography.caption, styles.label, { color: theme.colors.parchment }]}>
          {label}
        </Text>
      )}
      
      <View style={[styles.track, { backgroundColor: theme.colors.borderSilver }]}>
        <Animated.View style={[styles.fill, { width: widthInt }]}>
          <LinearGradient
            colors={[theme.colors.gold, theme.colors.emerald]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
});
