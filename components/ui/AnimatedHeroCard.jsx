// components/ui/AnimatedHeroCard.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ImageBackground, Animated, Dimensions,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../constants/ThemeContext';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_W - 40;

/**
 * Premium hero carousel with swipe + auto-play + smooth cross-fade transitions.
 * @param {Array}  slides   - Array of { image, title, subtitle }
 * @param {number} height   - Card height (default 280)
 * @param {number} interval - Auto-play interval in ms (default 4000)
 */
export default function AnimatedHeroCard({
  slides = [],
  height = 280,
  interval = 4000,
}) {
  const { theme } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);
  const autoPlayRef = useRef(null);

  // Slide transition fade
  const slideFade = useRef(new Animated.Value(1)).current;
  // Subtle scale breathe on the active slide
  const slidePulse = useRef(new Animated.Value(1)).current;

  // Start breathe pulse when active slide changes
  useEffect(() => {
    slidePulse.setValue(1);
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(slidePulse, { toValue: 1.02, duration: 4000, useNativeDriver: true }),
        Animated.timing(slidePulse, { toValue: 1, duration: 4000, useNativeDriver: true }),
      ])
    );
    breathe.start();
    return () => breathe.stop();
  }, [activeIndex]);

  // Auto-play timer
  const startAutoPlay = useCallback(() => {
    stopAutoPlay();
    if (slides.length <= 1) return;
    autoPlayRef.current = setInterval(() => {
      setActiveIndex(prev => {
        const next = (prev + 1) % slides.length;
        // Fade out → scroll → fade in
        Animated.timing(slideFade, { toValue: 0.6, duration: 200, useNativeDriver: true }).start(() => {
          flatListRef.current?.scrollToIndex({ index: next, animated: true });
          Animated.timing(slideFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        });
        return next;
      });
    }, interval);
  }, [slides.length, interval]);

  const stopAutoPlay = useCallback(() => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
  }, []);

  useEffect(() => {
    startAutoPlay();
    return stopAutoPlay;
  }, [startAutoPlay, stopAutoPlay]);

  // Handle manual swipe — detect which slide is visible
  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      setActiveIndex(newIndex);
      // Restart auto-play after manual swipe
      startAutoPlay();
    }
  }, [startAutoPlay]);

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderSlide = useCallback(({ item }) => (
    <Animated.View style={{ transform: [{ scale: slidePulse }], opacity: slideFade }}>
      <ImageBackground
        source={{ uri: item.image }}
        style={[styles.image, { height }]}
        imageStyle={{ borderRadius: 20 }}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
          style={styles.gradient}
        >
          <Text style={[theme.typography.displayL, styles.title, { color: '#fff' }]}>
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={[theme.typography.body, styles.subtitle, { color: 'rgba(255,255,255,0.8)' }]}>
              {item.subtitle}
            </Text>
          )}
        </LinearGradient>
      </ImageBackground>
    </Animated.View>
  ), [theme, height, slidePulse, slideFade]);

  if (slides.length === 0) return null;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(_, i) => `hero_${i}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH}
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: CARD_WIDTH,
          offset: CARD_WIDTH * index,
          index,
        })}
        style={{ borderRadius: 20 }}
      />

      {/* Animated Pagination Dots */}
      {slides.length > 1 && (
        <View style={styles.dotsRow}>
          {slides.map((_, i) => {
            const isActive = i === activeIndex;
            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: isActive ? theme.colors.gold : 'rgba(255,255,255,0.4)',
                    width: isActive ? 24 : 8,
                    // Active dot gets a subtle glow
                    ...(isActive && {
                      shadowColor: theme.colors.gold,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.6,
                      shadowRadius: 6,
                      elevation: 4,
                    }),
                  },
                ]}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    borderRadius: 20,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  image: {
    width: CARD_WIDTH,
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
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
