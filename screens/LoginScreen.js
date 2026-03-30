// screens/LoginScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

export default function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Access',
          'Location permission is needed for Smart Navigation. You can enable it later in Settings.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.warn('Location permission request failed:', error);
    }
  };

  const handleLogin = () => {
    // Reset errors
    setEmailError('');
    setPasswordError('');

    let hasError = false;

    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email');
      hasError = true;
    }

    // Validate password
    if (!password.trim()) {
      setPasswordError('Password is required');
      hasError = true;
    } else if (!validatePassword(password)) {
      setPasswordError('Password must be at least 6 characters');
      hasError = true;
    }

    if (hasError) return;

    // Simulate API call
    setLoading(true);
    setTimeout(async () => {
      // Fake login logic - replace with real API later
      if (email === 'demo@travel.com' && password === '123456') {
        // Request location permission before proceeding
        await requestLocationPermission();
        onLoginSuccess();
      } else {
        setEmailError('Invalid email or password');
        setPasswordError('Invalid email or password');
      }
      setLoading(false);
    }, 1500);
  };

  const getPasswordStrength = (password) => {
    if (password.length >= 8) return 'strong';
    if (password.length >= 6) return 'medium';
    return 'weak';
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>
          Sign in to access your travel tools
        </Text>
      </View>

      {/* Email Input */}
      <View style={styles.inputGroup}>
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#888" />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#777"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) setEmailError('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
        </View>
        {emailError ? (
          <Text style={styles.errorText}>{emailError}</Text>
        ) : null}
      </View>

      {/* Password Input */}
      <View style={styles.inputGroup}>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#888" />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#777"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError('');
            }}
            secureTextEntry
            editable={!loading}
          />
        </View>
        {passwordError ? (
          <Text style={styles.errorText}>{passwordError}</Text>
        ) : null}
        
        {/* Password strength indicator */}
        {password && !passwordError && (
          <View style={styles.strengthBar}>
            <View 
              style={[
                styles.strengthFill,
                { width: `${Math.min((password.length / 12) * 100, 100)}%` }
              ]}
            />
            <Text style={styles.strengthText}>
              {getPasswordStrength(password).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Login Button */}
      <TouchableOpacity 
        style={[
          styles.loginButton, 
          (emailError || passwordError || !email || !password) && styles.loginButtonDisabled
        ]}
        onPress={handleLogin}
        disabled={loading || !email || !password}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.loginButtonText}>Sign In</Text>
        )}
      </TouchableOpacity>

      {/* Demo credentials */}
      <View style={styles.demoInfo}>
        <Text style={styles.demoText}>
          Demo: demo@travel.com / 123456
        </Text>
      </View>

      {/* Forgot password */}
      <TouchableOpacity style={styles.forgotPassword}>
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050b18',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#b0b4c3',
    fontSize: 16,
    textAlign: 'center',
  },

  inputGroup: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161b2b',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 12,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
  },

  strengthBar: {
    height: 4,
    backgroundColor: '#1f2740',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  strengthFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  strengthText: {
    color: '#b0b4c3',
    fontSize: 12,
    marginTop: 4,
  },

  loginButton: {
    backgroundColor: '#ff7a45',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  loginButtonDisabled: {
    backgroundColor: '#1f2740',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },

  demoInfo: {
    alignItems: 'center',
    marginTop: 24,
  },
  demoText: {
    color: '#b0b4c3',
    fontSize: 13,
  },

  forgotPassword: {
    alignItems: 'center',
    marginTop: 20,
  },
  forgotPasswordText: {
    color: '#ff7a45',
    fontSize: 14,
    fontWeight: '600',
  },
});
