// components/ui/AnimatedHeroCard.jsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ImageBackground, Animated, Dimensions, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../constants/ThemeContext';

const { width: SCREEN_W } = Dimensions.get('window');

/**
 * Premium auto-playing hero carousel with cross-fade images.
 * @param {Array} slides  - Array of { image, title, subtitle }
 * @param {number} height - Card height (default 280)
 * @param {number} interval - Auto-play interval in ms (default 4000)
 * @param {function} onPress - Optional press handler
 */
export default function AnimatedHeroCard({
  slides = [],
  height = 280,
  interval = 4000,
  onPress,
}) {
  const { theme } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const textSlide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = setInterval(() => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        setActiveIndex(prev => (prev + 1) % slides.length);
        textSlide.setValue(30);

        // Fade in
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.spring(textSlide, {
            toValue: 0,
            useNativeDriver: true,
            speed: 14,
            bounciness: 4,
          }),
        ]).start();
      });
    }, interval);

    return () => clearInterval(timer);
  }, [slides.length, interval]);

  if (slides.length === 0) return null;

  const current = slides[activeIndex];

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={onPress}
      disabled={!onPress}
    >
      <Animated.View style={[styles.container, { height, opacity: fadeAnim }]}>
        <ImageBackground
          source={{ uri: current.image }}
          style={styles.image}
          imageStyle={{ borderRadius: 20 }}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
            style={styles.gradient}
          >
            <Animated.View style={{ transform: [{ translateY: textSlide }] }}>
              <Text style={[theme.typography.displayL, styles.title, { color: '#fff' }]}>
                {current.title}
              </Text>
              {current.subtitle && (
                <Text style={[theme.typography.body, styles.subtitle, { color: 'rgba(255,255,255,0.8)' }]}>
                  {current.subtitle}
                </Text>
              )}
            </Animated.View>

            {/* Pagination Dots */}
            {slides.length > 1 && (
              <View style={styles.dotsRow}>
                {slides.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: i === activeIndex ? theme.colors.gold : 'rgba(255,255,255,0.4)',
                        width: i === activeIndex ? 24 : 8,
                      },
                    ]}
                  />
                ))}
              </View>
            )}
          </LinearGradient>
        </ImageBackground>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_W - 40,
    borderRadius: 20,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  image: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
    borderRadius: 20,
  },
  title: {
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
