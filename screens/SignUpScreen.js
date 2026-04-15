// screens/SignUpScreen.js — New Account Registration
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../constants/ThemeContext';
import { useAuth } from '../constants/AuthContext';

import FloatingParticles from '../components/ui/FloatingParticles';
import GlassCard from '../components/ui/GlassCard';
import PressableGoldButton from '../components/ui/PressableGoldButton';

export default function SignUpScreen({ navigation }) {
  const { theme } = useTheme();
  const { signUp } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    // Validation
    if (!username.trim()) {
      Alert.alert('Missing Field', 'Please enter a username.');
      return;
    }
    if (username.trim().length < 3) {
      Alert.alert('Invalid Username', 'Username must be at least 3 characters.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Missing Field', 'Please enter your email.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await signUp(email.trim(), password, username.trim());
      // Auth state listener in AuthContext will handle navigation
    } catch (error) {
      let msg = 'Could not create account. Please try again.';
      if (error.code === 'auth/email-already-in-use') msg = 'An account with this email already exists.';
      else if (error.code === 'auth/invalid-email') msg = 'Invalid email address.';
      else if (error.code === 'auth/weak-password') msg = 'Password is too weak.';
      Alert.alert('Sign Up Failed', msg);
    }
    setLoading(false);
  };

  const renderInput = (icon, placeholder, value, onChangeText, opts = {}) => (
    <View style={[styles.inputRow, { backgroundColor: theme.colors.midnight, borderColor: theme.colors.borderSilver }]}>
      <Ionicons name={icon} size={18} color={theme.colors.parchment} style={{ marginRight: 10 }} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={theme.colors.ash}
        style={[theme.typography.body, styles.input, { color: theme.colors.ivory }]}
        value={value}
        onChangeText={onChangeText}
        {...opts}
      />
      {opts.isPassword && (
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={theme.colors.parchment}
          />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.obsidian }]}>
      <FloatingParticles count={15} color={theme.colors.gold} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.headerSection}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.ivory} />
            </TouchableOpacity>
            <View style={styles.logoBg}>
              <Ionicons name="person-add-outline" size={48} color={theme.colors.gold} />
            </View>
            <Text style={[theme.typography.displayL, { color: theme.colors.ivory, marginTop: 12 }]}>
              Create Account
            </Text>
            <Text style={[theme.typography.body, { color: theme.colors.parchment, marginTop: 6, textAlign: 'center' }]}>
              Join the global traveler community
            </Text>
          </View>

          {/* Form */}
          <GlassCard style={styles.formCard} glowOnPress={false}>
            {renderInput('person-outline', 'Full Name', username, setUsername, { autoCapitalize: 'words' })}
            {renderInput('mail-outline', 'Email', email, setEmail, { keyboardType: 'email-address', autoCapitalize: 'none' })}
            {renderInput('lock-closed-outline', 'Password (min 6 chars)', password, setPassword, {
              secureTextEntry: !showPassword,
              isPassword: true,
            })}
            {renderInput('shield-checkmark-outline', 'Confirm Password', confirmPassword, setConfirmPassword, {
              secureTextEntry: !showPassword,
            })}

            <PressableGoldButton
              label={loading ? 'Creating Account...' : 'Sign Up'}
              onPress={handleSignUp}
              loading={loading}
              disabled={loading}
              icon={!loading && <Ionicons name="checkmark-circle" size={20} color={theme.colors.ivory} />}
              style={{ marginTop: 8 }}
            />
          </GlassCard>

          {/* Login Link */}
          <View style={styles.loginRow}>
            <Text style={[theme.typography.body, { color: theme.colors.parchment }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={[theme.typography.body, { color: theme.colors.gold, fontWeight: '600' }]}>
                Sign In
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
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
});
