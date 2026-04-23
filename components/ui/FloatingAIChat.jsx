// components/ui/FloatingAIChat.jsx — Persistent AI chat icon
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../constants/ThemeContext';
import useAI from '../../hooks/useAI';

export default function FloatingAIChat() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { messages, loadChatHistory } = useAI();
  const bubblePulse = useRef(new Animated.Value(1)).current;

  // Load history to show unread badge if needed
  useEffect(() => { loadChatHistory(); }, []);

  // Pulse animation for the button
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(bubblePulse, { toValue: 1.08, duration: 1500, useNativeDriver: true }),
        Animated.timing(bubblePulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => navigation.navigate('AIChat')}
      style={styles.bubble}
    >
      <Animated.View style={{ transform: [{ scale: bubblePulse }] }}>
        <LinearGradient
          colors={[theme.colors.gold, theme.colors.goldMuted]}
          style={styles.bubbleGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="chatbubble-ellipses" size={22} color={theme.colors.obsidian} />
        </LinearGradient>
      </Animated.View>
      {/* Unread badge */}
      {messages.length > 0 && (
        <View style={styles.bubbleBadge}>
          <Text style={styles.bubbleBadgeText}>AI</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    top: 48, // Beside the notification icon in headers
    right: 64,
    zIndex: 997,
    // Shadow
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 12,
  },
  bubbleGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubbleBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#10B981',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
  },
  bubbleBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
  },
});
