// screens/LoginScreen.js — Full authentication with email/password + Google Sign-In
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '../constants/ThemeContext';
import { useAuth } from '../constants/AuthContext';

import FloatingParticles from '../components/ui/FloatingParticles';
import GoldShimmerText from '../components/ui/GoldShimmerText';
import PressableGoldButton from '../components/ui/PressableGoldButton';
import GlassCard from '../components/ui/GlassCard';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  const { theme } = useTheme();
  const { signIn, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // ═══ Google Sign-In via expo-auth-session ═══
  // TODO: Replace with your Google OAuth client IDs from Google Cloud Console
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
    // androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
    // iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleSignIn(response.params.id_token);
    }
  }, [response]);

  const handleGoogleSignIn = async (idToken) => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle(idToken);
    } catch (error) {
      Alert.alert('Google Sign-In Failed', error.message);
    }
    setGoogleLoading(false);
  };

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
      if (error.code === 'auth/user-not-found') msg = 'No account found with this email.';
      else if (error.code === 'auth/wrong-password') msg = 'Incorrect password.';
      else if (error.code === 'auth/invalid-email') msg = 'Invalid email address.';
      else if (error.code === 'auth/invalid-credential') msg = 'Invalid email or password.';
      Alert.alert('Login Failed', msg);
    }
    setLoading(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.obsidian }]}>
      <FloatingParticles count={20} color={theme.colors.gold} />

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
            <View style={styles.logoBg}>
              <Ionicons name="compass-outline" size={56} color={theme.colors.gold} />
            </View>
            <GoldShimmerText
              text="TouristGuide"
              style={theme.typography.displayXL}
              loop={false}
              delay={300}
            />
            <Text style={[theme.typography.body, styles.tagline, { color: theme.colors.parchment }]}>
              Explore. Navigate. Discover.
            </Text>
          </View>

          {/* ═══ Login Form ═══ */}
          <GlassCard style={styles.formCard} glowOnPress={false}>
            <Text style={[theme.typography.headingS, { color: theme.colors.ivory, marginBottom: 20 }]}>
              WELCOME BACK
            </Text>

            {/* Email */}
            <View style={[styles.inputRow, { backgroundColor: theme.colors.midnight, borderColor: theme.colors.borderSilver }]}>
              <Ionicons name="mail-outline" size={18} color={theme.colors.parchment} style={{ marginRight: 10 }} />
              <TextInput
                placeholder="Email"
                placeholderTextColor={theme.colors.ash}
                style={[theme.typography.body, styles.input, { color: theme.colors.ivory }]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <View style={[styles.inputRow, { backgroundColor: theme.colors.midnight, borderColor: theme.colors.borderSilver }]}>
              <Ionicons name="lock-closed-outline" size={18} color={theme.colors.parchment} style={{ marginRight: 10 }} />
              <TextInput
                placeholder="Password"
                placeholderTextColor={theme.colors.ash}
                style={[theme.typography.body, styles.input, { color: theme.colors.ivory }]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={theme.colors.parchment}
                />
              </TouchableOpacity>
            </View>

            {/* Sign In Button */}
            <PressableGoldButton
              label={loading ? 'Signing In...' : 'Sign In'}
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              icon={!loading && <Ionicons name="log-in-outline" size={20} color={theme.colors.ivory} />}
              style={{ marginTop: 8 }}
            />

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.borderSilver }]} />
              <Text style={[theme.typography.caption, { color: theme.colors.ash, marginHorizontal: 12 }]}>OR</Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.borderSilver }]} />
            </View>

            {/* Google Sign-In */}
            <TouchableOpacity
              style={[styles.googleBtn, { borderColor: theme.colors.borderSilver }]}
              onPress={() => promptAsync()}
              disabled={!request || googleLoading}
            >
              {googleLoading ? (
                <ActivityIndicator size="small" color={theme.colors.gold} />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color="#DB4437" />
                  <Text style={[theme.typography.body, { color: theme.colors.ivory, marginLeft: 10 }]}>
                    Continue with Google
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </GlassCard>

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
  logoBg: { marginBottom: 16, opacity: 0.9 },
  tagline: { marginTop: 8, letterSpacing: 0.5 },
  formCard: {
    padding: 24,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 4,
    marginBottom: 14,
  },
  input: { flex: 1 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: { flex: 1, height: 1 },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
});
