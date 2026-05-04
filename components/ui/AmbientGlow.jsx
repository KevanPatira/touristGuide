// components/ui/AmbientGlow.jsx
// Adds a pulsing, ambient background glow behind its children.
// Designed to sit behind GlassCards / feature cards to add depth and interactivity.
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

/**
 * @param {string}  color       — glow colour (hex, default '#C9A84C')
 * @param {number}  intensity   — max opacity of the glow (0-1, default 0.25)
 * @param {number}  size        — how far the glow extends beyond children (default 18)
 * @param {number}  duration    — full pulse cycle in ms (default 3000)
 * @param {boolean} active      — whether the glow pulses; static glow otherwise
 * @param {object}  style       — extra styles on the container
 */
export default function AmbientGlow({
  children,
  color = '#C9A84C',
  intensity = 0.25,
  size = 18,
  duration = 3000,
  active = true,
  style,
}) {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      pulseAnim.setValue(0.5);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: duration / 2,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: duration / 2,
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, duration]);

  const glowOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [intensity * 0.4, intensity],
  });

  const glowScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });

  return (
    <View style={[styles.container, style]}>
      {/* Glow layer — rendered behind children */}
      <Animated.View
        style={[
          styles.glow,
          {
            backgroundColor: color,
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
            top: -size,
            left: -size,
            right: -size,
            bottom: -size,
            borderRadius: 28 + size,
          },
        ]}
      />
      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    // blur is simulated via opacity + large radius
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});
