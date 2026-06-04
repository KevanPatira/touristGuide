import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '../constants/ThemeContext';
import { useAuth } from '../constants/AuthContext';

import FloatingParticles from '../components/ui/FloatingParticles';
import GlassCard from '../components/ui/GlassCard';
import PressableGoldButton from '../components/ui/PressableGoldButton';
import AuthLayout from '../components/ui/AuthLayout';
import AuthInput from '../components/ui/AuthInput';

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen({ navigation }) {
  const { theme } = useTheme();
  const { signUp } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Field', 'Please enter your name.');
      return;
    }
    if (name.trim().length < 3) {
      Alert.alert('Invalid Name', 'Name must be at least 3 characters.');
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
    if (!/\d/.test(password)) {
      Alert.alert('Weak Password', 'Password must contain at least one number.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await signUp(email.trim(), password, name.trim());
    } catch (error) {
      console.log('[SignUp] Error:', error.message, error.response?.status, error.response?.data);
      let msg = 'Could not create account. Please try again.';
      if (error.response?.status === 400) {
        if (error.response.data?.message) msg = error.response.data.message;
        else if (error.response.data?.errors) msg = error.response.data.errors.map(e => e.msg).join('\n');
      } else if (error.response?.status === 429) {
        msg = 'Too many registration attempts. Please try again later.';
      } else if (!error.response) {
        msg = 'Cannot reach server. Please check your internet connection or try again later.';
      }
      Alert.alert('Sign Up Failed', msg);
    }
    setLoading(false);
  };


  const footer = (
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
  );

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join the global traveler community"
      iconName="person-add-outline"
      onBack={() => navigation.goBack()}
      particles={<FloatingParticles count={15} color={theme.colors.gold} />}
      footerContent={footer}
    >
      <GlassCard style={styles.formCard} glowOnPress={false}>
        <AuthInput
          icon="person-outline"
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          opts={{ autoCapitalize: 'words' }}
        />
        <AuthInput
          icon="mail-outline"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          opts={{ keyboardType: 'email-address', autoCapitalize: 'none' }}
        />
        <AuthInput
          icon="lock-closed-outline"
          placeholder="Password (min 6 chars)"
          value={password}
          onChangeText={setPassword}
          isPassword={true}
        />
        <AuthInput
          icon="shield-checkmark-outline"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          isPassword={true}
        />

        <PressableGoldButton
          label={loading ? 'Creating Account...' : 'Sign Up'}
          onPress={handleSignUp}
          loading={loading}
          disabled={loading}
          style={{ marginTop: 8 }}
        />


      </GlassCard>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  formCard: {
    padding: 24,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
});
