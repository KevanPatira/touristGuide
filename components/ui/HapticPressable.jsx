// components/ui/HapticPressable.jsx
import React from 'react';
import { Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * A Pressable wrapper that automatically triggers a haptic impact on press.
 */
export default function HapticPressable({ onPress, children, impactStyle = Haptics.ImpactFeedbackStyle.Light, ...props }) {
  const handlePress = async (e) => {
    try {
      await Haptics.impactAsync(impactStyle);
    } catch (err) {
      // Gracefully fail if haptics are not available/supported
    }
    if (onPress) {
      onPress(e);
    }
  };

  return (
    <Pressable onPress={handlePress} {...props}>
      {children}
    </Pressable>
  );
}
