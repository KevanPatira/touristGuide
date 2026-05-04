// components/ui/GoldShimmerText.jsx
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useTheme } from '../../constants/ThemeContext';

const { width: SCREEN_W } = Dimensions.get('window');

/**
 * Animated golden shimmer text.
 * @param {string} text - Text to display
 * @param {object} style - Text style
 * @param {boolean} loop - Whether the animation loops continuously
 * @param {number} delay - Delay before starting animation (ms)
 */
export default function GoldShimmerText({ text, style, loop = false, delay = 0 }) {
  const { theme } = useTheme();
  const translateX = useRef(new Animated.Value(-SCREEN_W)).current;

  useEffect(() => {
    const anim = Animated.timing(translateX, {
      toValue: SCREEN_W,
      duration: 2500,
      delay,
      useNativeDriver: true,
    });

    if (loop) {
      Animated.loop(anim).start();
    } else {
      anim.start();
    }
  }, [loop, delay]);

  const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

  return (
    <MaskedView
      style={styles.maskedContainer}
      maskElement={
        <Text style={[style, styles.maskText]}>
          {text}
        </Text>
      }
    >
      {/* Base Text (Solid color) */}
      <Text style={[style, { color: theme.colors.goldMuted, opacity: 0.8 }]}>
        {text}
      </Text>
      
      {/* Sweeping Shimmer Gradient overlay */}
      <AnimatedGradient
        colors={[
          'rgba(232, 201, 126, 0)',
          'rgba(232, 201, 126, 0.8)',
          'rgba(255, 255, 255, 1)',
          'rgba(232, 201, 126, 0.8)',
          'rgba(232, 201, 126, 0)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.shimmerLayer,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  maskedContainer: {
    // The container height/width will naturally wrap the text
    flexDirection: 'row',
  },
  maskText: {
    backgroundColor: 'transparent',
  },
  shimmerLayer: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_W * 1.5, // make it wide enough
  },
});
