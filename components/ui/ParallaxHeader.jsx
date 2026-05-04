// components/ui/ParallaxHeader.jsx
import React from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_W } = Dimensions.get('window');

/**
 * Parallax header that scales an image based on scroll position.
 * @param {string} imageUri   - URI for the background image
 * @param {number} height     - Header height (default 300)
 * @param {Animated.Value} scrollY - Animated scroll value from parent ScrollView
 * @param {ReactNode} children - Content to overlay on the image
 * @param {Array} gradientColors - Gradient overlay colors
 */
export default function ParallaxHeader({
  imageUri,
  height = 300,
  scrollY,
  children,
  gradientColors = ['transparent', 'rgba(13,13,13,0.6)', 'rgba(13,13,13,1)'],
}) {
  // Image scales up when pulling down, moves up when scrolling
  const imageScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.5, 1],
    extrapolateRight: 'clamp',
  });

  const imageTranslateY = scrollY.interpolate({
    inputRange: [0, height],
    outputRange: [0, -height * 0.4],
    extrapolateRight: 'clamp',
  });

  return (
    <View style={[styles.container, { height }]}>
      <Animated.Image
        source={{ uri: imageUri }}
        style={[
          styles.image,
          {
            height: height + 50,
            transform: [
              { scale: imageScale },
              { translateY: imageTranslateY },
            ],
          },
        ]}
        resizeMode="cover"
      />
      <LinearGradient
        colors={gradientColors}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={styles.content}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: SCREEN_W,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 24,
    paddingBottom: 32,
  },
});
