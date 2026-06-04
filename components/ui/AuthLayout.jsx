import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform,
  Animated, ScrollView, ImageBackground, TouchableOpacity
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../constants/ThemeContext';

export default function AuthLayout({
  children,
  title,
  subtitle,
  iconName,
  onBack,
  bgImage = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=60',
  particles = null,
  footerContent = null
}) {
  const { theme } = useTheme();
  
  const bgFade = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(40)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(bgFade, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(formSlide, {
          toValue: 0,
          speed: 12,
          bounciness: 5,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.obsidian }]}>
      {/* Background Image & Gradient */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgFade }]}>
        <ImageBackground source={{ uri: bgImage }} style={StyleSheet.absoluteFill} resizeMode="cover">
          <LinearGradient
            colors={['rgba(13,13,13,0.5)', 'rgba(13,13,13,0.75)', 'rgba(13,13,13,0.92)', theme.colors.obsidian]}
            locations={[0, 0.3, 0.6, 0.85]}
            style={StyleSheet.absoluteFill}
          />
        </ImageBackground>
      </Animated.View>

      {particles}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            {onBack && (
              <TouchableOpacity style={styles.backBtn} onPress={onBack}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.ivory} />
              </TouchableOpacity>
            )}
            
            <View style={styles.logoBg}>
              <Ionicons name={iconName} size={48} color={theme.colors.gold} />
            </View>
            <Text style={[theme.typography.displayL, { color: theme.colors.ivory, marginTop: 12 }]}>
              {title}
            </Text>
            {subtitle && (
              <Text style={[theme.typography.body, { color: theme.colors.parchment, marginTop: 6, textAlign: 'center' }]}>
                {subtitle}
              </Text>
            )}
          </View>

          {/* Form Content */}
          <Animated.View style={{ opacity: formOpacity, transform: [{ translateY: formSlide }] }}>
            {children}
          </Animated.View>

          {/* Footer (like tags or register link) */}
          {footerContent}

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 60,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 28,
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: 8,
    zIndex: 10,
  },
  logoBg: { marginBottom: 4, opacity: 0.9 },
});
