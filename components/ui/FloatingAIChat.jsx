// components/ui/FloatingAIChat.jsx — Persistent AI chat icon pinned to top bar
// Matches the notification icon style: 40×40 glass button, icon size 20
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../constants/ThemeContext';

export default function FloatingAIChat() {
  const { theme } = useTheme();
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => navigation.navigate('AIChat')}
      style={[styles.bubble, {
        backgroundColor: theme.colors.glassBg,
        borderColor: theme.colors.glassStroke,
      }]}
    >
      <Ionicons name="chatbubble-ellipses" size={20} color={theme.colors.gold} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    // Aligned with notification icons across Explore/Community/Profile screens
    top: Platform.OS === 'ios' ? 58 : 56,
    right: 66,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
});
