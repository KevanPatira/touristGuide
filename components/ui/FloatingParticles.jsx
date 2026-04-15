// components/ui/FloatingParticles.jsx
import React, { useEffect, useRef, useMemo } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

function Particle({ color }) {
  const animValue = useRef(new Animated.Value(0)).current;

  // Randomize characteristics once per particle mount
  const config = useMemo(() => {
    return {
      size: Math.random() * 3 + 1, // 1 to 4px
      startX: Math.random() * SCREEN_W,
      endX: Math.random() * SCREEN_W,
      duration: Math.random() * 5000 + 4000, // 4s to 9s
      maxOpacity: Math.random() * 0.3 + 0.1, // 0.1 to 0.4
      delay: Math.random() * 2000,
    };
  }, []);

  useEffect(() => {
    const anim = Animated.timing(animValue, {
      toValue: 1,
      duration: config.duration,
      delay: config.delay,
      useNativeDriver: true,
    });
    Animated.loop(anim).start();
  }, [animValue, config]);

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_H, -20], // Move up from bottom to top
  });

  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [config.startX, config.endX],
  });

  const opacity = animValue.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, config.maxOpacity, config.maxOpacity, 0],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: config.size,
        height: config.size,
        borderRadius: config.size / 2,
        backgroundColor: color,
        transform: [{ translateY }, { translateX }],
        opacity,
      }}
    />
  );
}

/**
 * Animated background layer with floating particles.
 * @param {number} count - Number of particles
 * @param {string} color - Color of the particles
 * @param {object} style - Extra styles for the container
 */
export default function FloatingParticles({ count = 30, color = '#C9A84C', style }) {
  const particles = useMemo(() => Array.from({ length: count }), [count]);

  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      {particles.map((_, i) => (
        <Particle key={`particle-${i}`} color={color} />
      ))}
    </View>
  );
}
