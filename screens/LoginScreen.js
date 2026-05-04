import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../constants/ThemeContext';
import { useAuth } from '../constants/AuthContext';

import AuthLayout from '../components/ui/AuthLayout';
import AuthInput from '../components/ui/AuthInput';
import PressableGoldButton from '../components/ui/PressableGoldButton';
import GlassCard from '../components/ui/GlassCard';

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
  const [loading, setLoading] = useState(false);
  const [activeTagline, setActiveTagline] = useState(0);

  const taglineFade = useRef(new Animated.Value(1)).current;
  const taglineSlide = useRef(new Animated.Value(0)).current;

  // Load saved email on mount
  useEffect(() => {
    const loadSavedEmail = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem('lastUserEmail');
        if (savedEmail) setEmail(savedEmail);
      } catch (e) {
        console.log('Failed to load saved email');
      }
    };
    loadSavedEmail();
  }, []);

  // Tagline auto-rotate
  useEffect(() => {
    const timer = setInterval(() => {
      Animated.parallel([
        Animated.timing(taglineFade, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(taglineSlide, { toValue: -20, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        setActiveTagline(prev => (prev + 1) % TAGLINES.length);
        taglineSlide.setValue(20);
        Animated.parallel([
          Animated.timing(taglineFade, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.spring(taglineSlide, { toValue: 0, speed: 15, bounciness: 4, useNativeDriver: true }),
        ]).start();
      });
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      // Save email for next time
      await AsyncStorage.setItem('lastUserEmail', email.trim());
    } catch (error) {
      let msg = 'An error occurred. Please try again.';
      if (error.response?.status === 401) msg = 'Invalid email or password.';
      else if (error.response?.status === 429) msg = 'Too many login attempts. Please try again later.';
      else if (error.response?.data?.message) msg = error.response.data.message;
      else if (error.response?.data?.errors) msg = error.response.data.errors.map(e => e.msg).join('\n');
      else if (!error.response) {
        msg = 'Cannot reach server. Please check your network or try again later.';
      }
      Alert.alert('Login Failed', msg);
    }
    setLoading(false);
  };

  const currentTagline = TAGLINES[activeTagline];

  const footer = (
    <View style={styles.registerRow}>
      <Text style={[theme.typography.body, { color: theme.colors.parchment }]}>
        Don't have an account?{' '}
      </Text>
      <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
        <Text style={[theme.typography.body, { color: theme.colors.gold, fontWeight: '600' }]}>
          Create One
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Continue your journey with us"
      iconName="compass-outline"
      footerContent={footer}
    >
      <GlassCard style={styles.formCard} glowOnPress={false}>
        <AuthInput
          icon="mail-outline"
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          opts={{ keyboardType: 'email-address', autoCapitalize: 'none' }}
        />
        <AuthInput
          icon="lock-closed-outline"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          isPassword={true}
        />

        <TouchableOpacity style={styles.forgotBtn}>
          <Text style={[theme.typography.caption, { color: theme.colors.goldMuted }]}>
            Forgot Password?
          </Text>
        </TouchableOpacity>

        <PressableGoldButton
          label={loading ? 'Authenticating...' : 'Sign In'}
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={{ marginTop: 16 }}
        />
      </GlassCard>

      <View style={styles.taglineContainer}>
        <Animated.View style={{ opacity: taglineFade, transform: [{ translateY: taglineSlide }] }}>
          <View style={styles.taglineInner}>
            <View style={[styles.taglineIconBg, { backgroundColor: theme.colors.gold + '22' }]}>
              <Ionicons name={currentTagline.icon} size={16} color={theme.colors.gold} />
            </View>
            <Text style={[theme.typography.body, { color: theme.colors.ivory, fontWeight: '500' }]}>
              {currentTagline.text}
            </Text>
          </View>
        </Animated.View>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  formCard: {
    padding: 24,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  taglineContainer: {
    marginTop: 40,
    alignItems: 'center',
    height: 40,
  },
  taglineInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taglineIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
});
