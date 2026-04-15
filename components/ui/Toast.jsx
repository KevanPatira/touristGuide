// components/ui/Toast.jsx
import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../constants/ThemeContext';
import GlassCard from './GlassCard';

const { width: SCREEN_W } = Dimensions.get('window');

/**
 * A custom slide-up glass toast.
 * Accessible via ref methods: toastRef.current.show('Message')
 */
const Toast = forwardRef((props, ref) => {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useImperativeHandle(ref, () => ({
    show: (msg, duration = 2500) => {
      setMessage(msg);
      setVisible(true);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 12,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();

      setTimeout(() => {
        hide();
      }, duration);
    }
  }));

  const hide = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start(() => {
      setVisible(false);
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        }
      ]}
      pointerEvents="none"
    >
      <GlassCard glowOnPress={false} style={styles.toastCard}>
        <Ionicons name="checkmark-circle" size={24} color={theme.colors.emerald} />
        <Text style={[theme.typography.headingS, styles.text, { color: theme.colors.ivory }]}>
          {message}
        </Text>
      </GlassCard>
    </Animated.View>
  );
});

export default Toast;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 9999,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
  },
  text: {
    marginLeft: 12,
  },
});
