// voiceTranslator/MicButton.jsx
// Large animated microphone button with pulsing ring effect when active.
// Supports both press-and-hold (onPressIn/onPressOut) AND single tap toggle.
// Pulse rings use pointerEvents="none" so they don't block touches.

import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MicButton({
  isListening,
  onPress,
  onPressIn,
  onPressOut,
  disabled,
  label,
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulse2Anim = useRef(new Animated.Value(1)).current;
  const opacity2Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isListening) {
      // Ring 1
      const ring1 = Animated.loop(
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 2.0,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacityAnim, {
              toValue: 0.4,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      // Ring 2 (delayed)
      const ring2 = Animated.loop(
        Animated.sequence([
          Animated.delay(400),
          Animated.parallel([
            Animated.timing(pulse2Anim, {
              toValue: 1.8,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(opacity2Anim, {
                toValue: 0.3,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.timing(opacity2Anim, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ])
      );

      ring1.start();
      ring2.start();

      return () => {
        ring1.stop();
        ring2.stop();
        pulseAnim.setValue(1);
        opacityAnim.setValue(0);
        pulse2Anim.setValue(1);
        opacity2Anim.setValue(0);
      };
    } else {
      pulseAnim.setValue(1);
      opacityAnim.setValue(0);
      pulse2Anim.setValue(1);
      opacity2Anim.setValue(0);
    }
  }, [isListening]);

  return (
    <View style={styles.outerWrapper}>
      <View style={styles.wrapper}>
        {/* Pulse rings — pointerEvents="none" so they never block the button */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pulseRing,
            {
              transform: [{ scale: pulseAnim }],
              opacity: opacityAnim,
            },
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pulseRing,
            styles.pulseRing2,
            {
              transform: [{ scale: pulse2Anim }],
              opacity: opacity2Anim,
            },
          ]}
        />

        {/* Main button — hold to speak (onPressIn/onPressOut) */}
        <TouchableOpacity
          style={[
            styles.button,
            isListening && styles.buttonActive,
            disabled && styles.buttonDisabled,
          ]}
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          disabled={disabled}
          activeOpacity={0.7}
          accessibilityLabel={
            isListening ? 'Release to stop' : 'Hold to speak'
          }
          accessibilityRole="button"
        >
          <Ionicons
            name={isListening ? 'stop' : 'mic'}
            size={48}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
      <Text style={[styles.label, isListening && styles.labelActive]}>
        {label || (isListening ? 'Release to stop' : 'Hold to speak')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  wrapper: {
    width: 110,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ff7a45',
  },
  pulseRing2: {
    backgroundColor: '#ff9966',
  },
  button: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ff7a45',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff7a45',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  buttonActive: {
    backgroundColor: '#e04422',
  },
  buttonDisabled: {
    backgroundColor: '#555',
    shadowOpacity: 0,
    elevation: 0,
  },
  label: {
    color: '#b0b4c3',
    fontSize: 13,
    marginTop: 8,
    fontWeight: '500',
  },
  labelActive: {
    color: '#ff7a45',
    fontWeight: '600',
  },
});
