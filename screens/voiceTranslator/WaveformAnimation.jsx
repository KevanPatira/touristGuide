// voiceTranslator/WaveformAnimation.jsx
// Animated waveform bars displayed while recording is active

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

const BAR_COUNT = 7;
const BAR_COLORS = ['#E8622A', '#F0854A', '#E8622A', '#F0854A', '#E8622A', '#F0854A', '#E8622A'];

function AnimatedBar({ delay, color, isActive }) {
  const heightAnim = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    if (isActive) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(heightAnim, {
            toValue: 28 + Math.random() * 16,
            duration: 300 + Math.random() * 200,
            delay,
            useNativeDriver: false,
          }),
          Animated.timing(heightAnim, {
            toValue: 6 + Math.random() * 6,
            duration: 300 + Math.random() * 200,
            useNativeDriver: false,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      Animated.timing(heightAnim, {
        toValue: 8,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [isActive]);

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          height: heightAnim,
          backgroundColor: isActive ? color : '#D1CBC2',
        },
      ]}
    />
  );
}

export default function WaveformAnimation({ isActive }) {
  return (
    <View style={styles.container}>
      {BAR_COLORS.map((color, index) => (
        <AnimatedBar
          key={index}
          delay={index * 60}
          color={color}
          isActive={isActive}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    gap: 4,
  },
  bar: {
    width: 4,
    borderRadius: 2,
  },
});
