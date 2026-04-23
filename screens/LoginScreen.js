// screens/LoginScreen.js — Email/password authentication via Express API
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, Animated,
  ScrollView, Dimensions, ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../constants/ThemeContext';
import { useAuth } from '../constants/AuthContext';

import GoldShimmerText from '../components/ui/GoldShimmerText';
import PressableGoldButton from '../components/ui/PressableGoldButton';
import GlassCard from '../components/ui/GlassCard';

const { width: SCREEN_W } = Dimensions.get('window');

// Onboarding taglines
const TAGLINES = [
  { icon: 'compass', text: 'Discover hidden gems' },
  { icon: 'navigate', text: 'Navigate with confidence' },
  { icon: 'people', text: 'Connect with travelers' },
];

export default function LoginScreen({ navigation }) {
  const { theme } = useTheme();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [activeTagline, setActiveTagline] = useState(0);

  // Animations
  const bgFade = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(40)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const taglineFade = useRef(new Animated.Value(1)).current;
  const taglineSlide = useRef(new Animated.Value(0)).current;
  const socialProofPulse = useRef(new Animated.Value(0.6)).current;
  const emailBorderAnim = useRef(new Animated.Value(0)).current;
  const passwordBorderAnim = useRef(new Animated.Value(0)).current;

  // Mount animations
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

    // Social proof pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(socialProofPulse, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(socialProofPulse, {
          toValue: 0.6,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Tagline auto-rotate
  useEffect(() => {
    const timer = setInterval(() => {
      // Fade out
      Animated.parallel([
        Animated.timing(taglineFade, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(taglineSlide, {
          toValue: -20,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setActiveTagline(prev => (prev + 1) % TAGLINES.length);
        taglineSlide.setValue(20);
        // Fade in
        Animated.parallel([
          Animated.timing(taglineFade, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(taglineSlide, {
            toValue: 0,
            speed: 15,
            bounciness: 4,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Focus animations for inputs
  useEffect(() => {
    Animated.timing(emailBorderAnim, {
      toValue: emailFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [emailFocused]);

  useEffect(() => {
    Animated.timing(passwordBorderAnim, {
      toValue: passwordFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [passwordFocused]);

  const emailBorderColor = emailBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.borderSilver, theme.colors.gold],
  });

  const passwordBorderColor = passwordBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.borderSilver, theme.colors.gold],
  });

  // ═══ Email/Password Sign-In ═══
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (error) {
      let msg = 'An error occurred. Please try again.';
      if (error.response?.status === 401) msg = 'Invalid email or password.';
      else if (error.response?.status === 429) msg = 'Too many login attempts. Please try again later.';
      else if (error.response?.data?.message) msg = error.response.data.message;
      else if (error.response?.data?.errors) msg = error.response.data.errors.map(e => e.msg).join('\n');
      Alert.alert('Login Failed', msg);
    }
    setLoading(false);
  };

  const currentTagline = TAGLINES[activeTagline];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.obsidian }]}>
      {/* ═══ Background Image ═══ */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgFade }]}>
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=60' }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        >
          <LinearGradient
            colors={[
              'rgba(13,13,13,0.5)',
              'rgba(13,13,13,0.75)',
              'rgba(13,13,13,0.92)',
              theme.colors.obsidian,
            ]}
            locations={[0, 0.3, 0.6, 0.85]}
            style={StyleSheet.absoluteFill}
          />
        </ImageBackground>
      </Animated.View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ═══ Branding ═══ */}
          <View style={styles.brandSection}>
            <View style={[styles.logoBg, { borderColor: theme.colors.gold + '40' }]}>
              <LinearGradient
                colors={[theme.colors.gold + '15', 'transparent']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
              />
              <Ionicons name="compass-outline" size={52} color={theme.colors.gold} />
            </View>
            <GoldShimmerText
              text="TouristGuide"
              style={theme.typography.displayXL}
              loop={false}
              delay={300}
            />

            {/* Animated Tagline Carousel */}
            <Animated.View
              style={[
                styles.taglineRow,
                {
                  opacity: taglineFade,
                  transform: [{ translateY: taglineSlide }],
                },
              ]}
            >
              <Ionicons name={currentTagline.icon} size={16} color={theme.colors.gold} />
              <Text style={[theme.typography.body, { color: theme.colors.parchment, marginLeft: 8 }]}>
                {currentTagline.text}
              </Text>
            </Animated.View>

            {/* Pagination dots */}
            <View style={styles.taglineDots}>
              {TAGLINES.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.taglineDot,
                    {
                      backgroundColor: i === activeTagline ? theme.colors.gold : theme.colors.borderSilver,
                      width: i === activeTagline ? 20 : 6,
                    },
                  ]}
                />
              ))}
            </View>
          </View>

          {/* ═══ Login Form ═══ */}
          <Animated.View style={{
            opacity: formOpacity,
            transform: [{ translateY: formSlide }],
          }}>
            <GlassCard style={styles.formCard} glowOnPress={false}>
              <Text style={[theme.typography.headingS, { color: theme.colors.ivory, marginBottom: 20 }]}>
                WELCOME BACK
              </Text>

              {/* Email */}
              <Animated.View style={[styles.inputRow, {
                backgroundColor: theme.colors.midnight,
                borderColor: emailBorderColor,
              }]}>
                <Ionicons name="mail-outline" size={18} color={emailFocused ? theme.colors.gold : theme.colors.parchment} style={{ marginRight: 10 }} />
                <TextInput
                  placeholder="Email"
                  placeholderTextColor={theme.colors.ash}
                  style={[theme.typography.body, styles.input, { color: theme.colors.ivory }]}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </Animated.View>

              {/* Password */}
              <Animated.View style={[styles.inputRow, {
                backgroundColor: theme.colors.midnight,
                borderColor: passwordBorderColor,
              }]}>
                <Ionicons name="lock-closed-outline" size={18} color={passwordFocused ? theme.colors.gold : theme.colors.parchment} style={{ marginRight: 10 }} />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor={theme.colors.ash}
                  style={[theme.typography.body, styles.input, { color: theme.colors.ivory }]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={theme.colors.parchment}
                  />
                </TouchableOpacity>
              </Animated.View>

              {/* Sign In Button */}
              <PressableGoldButton
                label={loading ? 'Signing In...' : 'Sign In'}
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                icon={!loading && <Ionicons name="log-in-outline" size={20} color={theme.colors.ivory} />}
                style={{ marginTop: 8 }}
              />
            </GlassCard>
          </Animated.View>

          {/* ═══ Social Proof ═══ */}
          <Animated.View style={[styles.socialProof, { opacity: socialProofPulse }]}>
            <Ionicons name="people" size={14} color={theme.colors.goldMuted} />
            <Text style={[theme.typography.caption, { color: theme.colors.parchment, marginLeft: 6 }]}>
              Join 10,000+ travelers worldwide
            </Text>
          </Animated.View>

          {/* ═══ Sign Up Link ═══ */}
          <View style={styles.signupRow}>
            <Text style={[theme.typography.body, { color: theme.colors.parchment }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={[theme.typography.body, { color: theme.colors.gold, fontWeight: '600' }]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
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
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBg: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    height: 24,
  },
  taglineDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  taglineDot: {
    height: 6,
    borderRadius: 3,
  },
  formCard: {
    padding: 24,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 4,
    marginBottom: 14,
  },
  input: { flex: 1 },
  socialProof: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
});
