// components/ui/GlassCard.jsx
import React, { useRef } from 'react';
import { View, Pressable, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../constants/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Premium card container with glass effect and animated press.
 * @param {ReactNode} children - Content
 * @param {object} style - Optional extra styles for the container
 * @param {function} onPress - Press handler
 * @param {boolean} glowOnPress - Whether border brightens on press
 */
export default function GlassCard({ children, style, onPress, glowOnPress = true }) {
  const { theme } = useTheme();
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: false,
      speed: 20,
      bounciness: 10,
    }).start();

    if (glowOnPress) {
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false, // Border color animation doesn't support native driver
      }).start();
    }
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: false,
      speed: 20,
      bounciness: 10,
    }).start();

    if (glowOnPress) {
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(201, 168, 76, 0.2)', 'rgba(201, 168, 76, 0.5)'],
  });

  const cardContent = (
    <>
      {/* Top Edge Highlight */}
      <LinearGradient
        colors={['rgba(201, 168, 76, 0.1)', 'transparent']}
        style={styles.topHighlight}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      {children}
    </>
  );

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPress && handlePressIn}
      onPressOut={onPress && handlePressOut}
      disabled={!onPress}
      style={[
        styles.container,
        {
          borderColor: onPress && glowOnPress ? borderColor : 'rgba(201, 168, 76, 0.2)',
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
    >
      {cardContent}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    // Fallback shadow for non-glass
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 20,
    zIndex: 0,
    opacity: 0.8,
  },
});
