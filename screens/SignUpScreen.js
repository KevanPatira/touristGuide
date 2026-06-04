import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  Animated, TextInput, Platform, Keyboard,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../constants/ThemeContext';
import { useAuth } from '../constants/AuthContext';
import { sendOtp, verifyOtp } from '../services/otp.service';

import FloatingParticles from '../components/ui/FloatingParticles';
import GlassCard from '../components/ui/GlassCard';
import PressableGoldButton from '../components/ui/PressableGoldButton';
import AuthLayout from '../components/ui/AuthLayout';
import AuthInput from '../components/ui/AuthInput';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export default function SignUpScreen({ navigation }) {
  const { theme } = useTheme();
  const { signUp } = useAuth();

  // ── Form state ──
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ── Step state ──
  const [step, setStep] = useState(1); // 1 = form, 2 = OTP
  const [loading, setLoading] = useState(false);

  // ── OTP state ──
  const [otpDigits, setOtpDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [countdown, setCountdown] = useState(0);
  const otpInputRefs = useRef([]);

  // ── Animations ──
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // ── Countdown timer for resend ──
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // ── Animate step transition ──
  const animateToStep = (nextStep) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: nextStep === 2 ? -30 : 30, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(nextStep === 2 ? 30 : -30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  };

  // ═════════════════════════════════════════════
  //  Step 1: Validate & Send OTP
  // ═════════════════════════════════════════════

  const handleContinue = async () => {
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
      await sendOtp(email.trim());
      setCountdown(RESEND_COOLDOWN);
      animateToStep(2);
      // Focus the first OTP input after transition
      setTimeout(() => otpInputRefs.current[0]?.focus(), 400);
    } catch (error) {
      let msg = 'Could not send verification code. Please try again.';
      if (error.response?.status === 400) {
        msg = error.response.data?.message || msg;
      } else if (error.response?.status === 429) {
        msg = 'Too many attempts. Please try again later.';
      } else if (!error.response) {
        msg = 'Cannot reach server. Please check your internet connection.';
      }
      Alert.alert('Error', msg);
    }
    setLoading(false);
  };

  // ═════════════════════════════════════════════
  //  Step 2: Verify OTP & Create Account
  // ═════════════════════════════════════════════

  const handleOtpChange = (text, index) => {
    // Handle paste of full OTP
    if (text.length === OTP_LENGTH) {
      const digits = text.split('').slice(0, OTP_LENGTH);
      setOtpDigits(digits);
      otpInputRefs.current[OTP_LENGTH - 1]?.focus();
      return;
    }

    const newDigits = [...otpDigits];

    if (text.length > 1) {
      // User pasted multiple chars — fill from current index
      const chars = text.split('');
      for (let i = 0; i < chars.length && index + i < OTP_LENGTH; i++) {
        newDigits[index + i] = chars[i];
      }
      setOtpDigits(newDigits);
      const nextIndex = Math.min(index + chars.length, OTP_LENGTH - 1);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    newDigits[index] = text;
    setOtpDigits(newDigits);

    // Auto-advance to next input
    if (text && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const newDigits = [...otpDigits];
      newDigits[index - 1] = '';
      setOtpDigits(newDigits);
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyAndSignUp = async () => {
    const otpCode = otpDigits.join('');
    if (otpCode.length !== OTP_LENGTH) {
      Alert.alert('Incomplete Code', 'Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    Keyboard.dismiss();
    try {
      // Step 1: Verify OTP
      const verifyResult = await verifyOtp(email.trim(), otpCode);
      if (!verifyResult.verified) {
        Alert.alert('Invalid Code', 'The verification code is incorrect.');
        setLoading(false);
        return;
      }

      // Step 2: Create account
      await signUp(email.trim(), password, name.trim());
      // signUp in AuthContext handles navigation automatically
    } catch (error) {
      let msg = 'Verification failed. Please try again.';
      if (error.response?.status === 400) {
        msg = error.response.data?.message || msg;
      } else if (!error.response) {
        msg = 'Cannot reach server. Please check your internet connection.';
      }
      Alert.alert('Error', msg);
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      await sendOtp(email.trim());
      setCountdown(RESEND_COOLDOWN);
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      otpInputRefs.current[0]?.focus();
      Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
    } catch (error) {
      let msg = 'Could not resend code. Please try again.';
      if (error.response?.status === 429) {
        msg = 'Too many attempts. Please try again later.';
      }
      Alert.alert('Error', msg);
    }
    setLoading(false);
  };

  // ═════════════════════════════════════════════
  //  Footer
  // ═════════════════════════════════════════════

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

  // ═════════════════════════════════════════════
  //  Render
  // ═════════════════════════════════════════════

  return (
    <AuthLayout
      title={step === 1 ? 'Create Account' : 'Verify Email'}
      subtitle={step === 1 ? 'Join the global traveler community' : `Enter the code sent to ${email}`}
      iconName={step === 1 ? 'person-add-outline' : 'shield-checkmark-outline'}
      onBack={() => {
        if (step === 2) {
          animateToStep(1);
        } else {
          navigation.goBack();
        }
      }}
      particles={<FloatingParticles count={15} color={theme.colors.gold} />}
      footerContent={step === 1 ? footer : null}
    >
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
        {step === 1 ? (
          /* ─── Step 1: Registration Form ─── */
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
              label={loading ? 'Sending Code...' : 'Continue'}
              onPress={handleContinue}
              loading={loading}
              disabled={loading}
              style={{ marginTop: 8 }}
            />
          </GlassCard>
        ) : (
          /* ─── Step 2: OTP Verification ─── */
          <GlassCard style={styles.formCard} glowOnPress={false}>
            {/* Email display */}
            <View style={styles.emailBadge}>
              <Ionicons name="mail" size={16} color={theme.colors.gold} />
              <Text style={[theme.typography.body, styles.emailText, { color: theme.colors.parchment }]}>
                {email}
              </Text>
            </View>

            {/* OTP Input Boxes */}
            <View style={styles.otpContainer}>
              {otpDigits.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { otpInputRefs.current[index] = ref; }}
                  style={[
                    styles.otpBox,
                    {
                      borderColor: digit
                        ? theme.colors.gold
                        : theme.colors.borderSilver,
                      color: theme.colors.ivory,
                      backgroundColor: theme.colors.midnight,
                    },
                  ]}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text.replace(/[^0-9]/g, ''), index)}
                  onKeyPress={(e) => handleOtpKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={Platform.OS === 'android' ? 1 : OTP_LENGTH}
                  selectTextOnFocus
                  textContentType="oneTimeCode"
                  autoComplete="sms-otp"
                />
              ))}
            </View>

            {/* Countdown & Resend */}
            <View style={styles.resendRow}>
              {countdown > 0 ? (
                <Text style={[theme.typography.body, { color: theme.colors.ash, fontSize: 13 }]}>
                  Resend code in{' '}
                  <Text style={{ color: theme.colors.gold, fontWeight: '600' }}>
                    {countdown}s
                  </Text>
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResendOtp} disabled={loading}>
                  <Text style={[theme.typography.body, { color: theme.colors.gold, fontWeight: '600', fontSize: 13 }]}>
                    Resend Code
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <PressableGoldButton
              label={loading ? 'Verifying...' : 'Verify & Create Account'}
              onPress={handleVerifyAndSignUp}
              loading={loading}
              disabled={loading}
              style={{ marginTop: 16 }}
            />

            {/* Back to form */}
            <TouchableOpacity
              onPress={() => animateToStep(1)}
              style={styles.backLink}
              disabled={loading}
            >
              <Ionicons name="arrow-back" size={16} color={theme.colors.parchment} />
              <Text style={[theme.typography.body, { color: theme.colors.parchment, marginLeft: 6, fontSize: 13 }]}>
                Edit details
              </Text>
            </TouchableOpacity>
          </GlassCard>
        )}
      </Animated.View>
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
  // ── OTP Step Styles ──
  emailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(201, 168, 76, 0.08)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 24,
  },
  emailText: {
    marginLeft: 8,
    fontSize: 13,
    opacity: 0.9,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  otpBox: {
    width: 46,
    height: 54,
    borderWidth: 1.5,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 2,
  },
  resendRow: {
    alignItems: 'center',
    marginBottom: 4,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 4,
  },
});
