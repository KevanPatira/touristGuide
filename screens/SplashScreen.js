// screens/SplashScreen.js
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Easing, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../constants/ThemeContext';
import GoldShimmerText from '../components/ui/GoldShimmerText';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function SplashScreen({ onFinish }) {
  const { theme } = useTheme();

  // Animation values
  const ringScale = useRef(new Animated.Value(3)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Orchestrated stagger sequence:
    // 0ms    → Background fades in
    // 200ms  → Ring contracts + fades in
    // 600ms  → Logo pops in
    // 900ms  → Title slides up
    // 1200ms → Tagline fades in
    // 1400ms → Progress bar fills
    // 2800ms → Finish

    Animated.sequence([
      // Background fade in
      Animated.timing(bgOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Ring contracts from large to small
      Animated.parallel([
        Animated.timing(ringScale, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Logo pops in
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          speed: 12,
          bounciness: 8,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // Title slides up
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(titleTranslateY, {
          toValue: 0,
          speed: 14,
          bounciness: 4,
          useNativeDriver: true,
        }),
      ]),
      // Tagline fades
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Progress bar
      Animated.timing(progressWidth, {
        toValue: 1,
        duration: 1000,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start(() => {
      onFinish();
    });
  }, []);

  const progressInterpolated = progressWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Background Travel Image */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgOpacity }]}>
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800&q=60' }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          blurRadius={3}
        >
          <LinearGradient
            colors={['rgba(13,13,13,0.7)', 'rgba(13,13,13,0.85)', theme.colors.obsidian]}
            style={StyleSheet.absoluteFill}
          />
        </ImageBackground>
      </Animated.View>

      {/* Dark overlay gradient */}
      <LinearGradient
        colors={[theme.colors.obsidian, 'transparent', theme.colors.obsidian]}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.5, 1]}
      />

      {/* Animated Golden Ring */}
      <Animated.View
        style={[
          styles.ring,
          {
            transform: [{ scale: ringScale }],
            opacity: ringOpacity,
            borderColor: theme.colors.gold,
          },
        ]}
      />

      {/* Logo Icon */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            transform: [{ scale: logoScale }],
            opacity: logoOpacity,
          },
        ]}
      >
        <LinearGradient
          colors={[theme.colors.gold, theme.colors.goldMuted]}
          style={styles.logoGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="compass" size={48} color={theme.colors.obsidian} />
        </LinearGradient>
      </Animated.View>

      {/* Title */}
      <Animated.View
        style={{
          opacity: titleOpacity,
          transform: [{ translateY: titleTranslateY }],
          marginTop: 24,
        }}
      >
        <GoldShimmerText
          text="Tourist Guide"
          style={[theme.typography.displayXL, { textAlign: 'center' }]}
          loop={false}
          delay={0}
        />
      </Animated.View>

      {/* Tagline */}
      <Animated.View style={{ opacity: taglineOpacity, marginTop: 12 }}>
        <Text style={[theme.typography.body, { color: theme.colors.parchment, textAlign: 'center', letterSpacing: 1 }]}>
          Your journey begins here
        </Text>
      </Animated.View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressTrack, { backgroundColor: theme.colors.borderSilver }]}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressInterpolated,
              },
            ]}
          >
            <LinearGradient
              colors={[theme.colors.goldMuted, theme.colors.gold, theme.colors.goldLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D0D0D',
  },
  ring: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    position: 'absolute',
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
  },
  logoGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 80,
    width: SCREEN_W * 0.5,
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
});
