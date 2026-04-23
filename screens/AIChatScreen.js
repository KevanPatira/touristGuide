// screens/AIChatScreen.js — Premium AI Travel Assistant Chat
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../constants/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useAI from '../hooks/useAI';
import FloatingParticles from '../components/ui/FloatingParticles';

const { width: SCREEN_W } = Dimensions.get('window');

// Quick suggestion chips
const QUICK_SUGGESTIONS = [
  { id: '1', icon: '🏖️', label: 'Top places in Goa', prompt: 'Suggest top 5 tourist places in Goa with short descriptions' },
  { id: '2', icon: '🗺️', label: 'Delhi → Jaipur route', prompt: 'Best route from Delhi to Jaipur considering traffic and distance' },
  { id: '3', icon: '🎒', label: 'Packing tips', prompt: 'Essential packing tips for a 7-day trip to Europe in summer' },
  { id: '4', icon: '💰', label: 'Budget planning', prompt: 'Budget planning tips for a 5-day trip to Thailand for 2 people' },
  { id: '5', icon: '🌦️', label: 'Weather advice', prompt: 'What is the best time to visit Manali and what clothes to pack?' },
  { id: '6', icon: '🍜', label: 'Local cuisine', prompt: 'Must-try street food and local cuisine in Bangalore' },
];

// ─── Typing indicator ────────────────────────────────────
function TypingIndicator({ theme }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600 - delay),
        ])
      );

    const a1 = createAnimation(dot1, 0);
    const a2 = createAnimation(dot2, 200);
    const a3 = createAnimation(dot3, 400);

    a1.start();
    a2.start();
    a3.start();

    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  const dotStyle = (dot) => ({
    opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
  });

  return (
    <View style={styles.typingRow}>
      <View style={[styles.aiBubbleOuter, { borderColor: theme.colors.borderGold }]}>
        <LinearGradient
          colors={['rgba(201, 168, 76, 0.08)', 'rgba(17, 24, 39, 0.95)']}
          style={styles.typingBubble}
        >
          <View style={styles.typingDots}>
            {[dot1, dot2, dot3].map((dot, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  { backgroundColor: theme.colors.gold },
                  dotStyle(dot),
                ]}
              />
            ))}
          </View>
          <Text style={[theme.typography.caption, { color: theme.colors.ash, marginLeft: 8 }]}>
            TravelMate is thinking...
          </Text>
        </LinearGradient>
      </View>
    </View>
  );
}

// ─── Message bubble component ────────────────────────────
function MessageBubble({ message, theme }) {
  const isUser = message.role === 'user';
  const isError = message.isError;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(isUser ? 30 : -30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 4 }),
    ]).start();
  }, []);

  if (isError) {
    return (
      <Animated.View style={[styles.errorRow, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
        <View style={[styles.errorBubble, { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
          <Ionicons name="warning" size={16} color={theme.colors.crimson} style={{ marginRight: 8 }} />
          <Text style={[theme.typography.body, { color: theme.colors.crimson, flex: 1, fontSize: 13 }]}>
            {message.content}
          </Text>
        </View>
      </Animated.View>
    );
  }

  if (isUser) {
    return (
      <Animated.View style={[styles.userRow, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
        <LinearGradient
          colors={[theme.colors.gold, theme.colors.goldMuted]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.userBubble}
        >
          <Text style={[theme.typography.body, styles.userText]}>
            {message.content}
          </Text>
        </LinearGradient>
      </Animated.View>
    );
  }

  // AI message
  return (
    <Animated.View style={[styles.aiRow, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
      {/* AI Avatar */}
      <View style={[styles.aiAvatar, { backgroundColor: 'rgba(201, 168, 76, 0.15)', borderColor: theme.colors.borderGold }]}>
        <Ionicons name="sparkles" size={14} color={theme.colors.gold} />
      </View>
      <View style={[styles.aiBubbleOuter, { borderColor: theme.colors.borderGold }]}>
        <LinearGradient
          colors={['rgba(201, 168, 76, 0.06)', 'rgba(17, 24, 39, 0.95)']}
          style={styles.aiBubble}
        >
          <Text style={[theme.typography.body, { color: theme.colors.ivory, fontSize: 14, lineHeight: 22 }]}>
            {message.content}
          </Text>
          <Text style={[theme.typography.caption, styles.timestamp, { color: theme.colors.ash }]}>
            {formatTime(message.timestamp)}
          </Text>
        </LinearGradient>
      </View>
    </Animated.View>
  );
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Empty state ─────────────────────────────────────────
function EmptyState({ theme, onSuggestionPress }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 8 }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.emptyState, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      {/* Logo / Icon */}
      <View style={[styles.emptyIcon, { borderColor: theme.colors.borderGold }]}>
        <LinearGradient
          colors={['rgba(201, 168, 76, 0.2)', 'rgba(201, 168, 76, 0.05)']}
          style={styles.emptyIconGradient}
        >
          <Ionicons name="sparkles" size={32} color={theme.colors.gold} />
        </LinearGradient>
      </View>

      <Text style={[theme.typography.displayM, { color: theme.colors.ivory, textAlign: 'center', marginTop: 20 }]}>
        TravelMate AI
      </Text>
      <Text style={[theme.typography.body, { color: theme.colors.parchment, textAlign: 'center', marginTop: 8, paddingHorizontal: 30 }]}>
        Your personal travel assistant. Ask me about destinations, routes, packing tips, budgets, and more.
      </Text>

      {/* Suggestion Chips */}
      <Text style={[theme.typography.label, { color: theme.colors.goldMuted, marginTop: 28, marginBottom: 12 }]}>
        TRY ASKING
      </Text>
      <View style={styles.suggestionsWrap}>
        {QUICK_SUGGESTIONS.map((s) => (
          <TouchableOpacity
            key={s.id}
            activeOpacity={0.7}
            style={[styles.suggestionChip, { backgroundColor: theme.colors.glassBg, borderColor: theme.colors.borderGold }]}
            onPress={() => onSuggestionPress(s.prompt)}
          >
            <Text style={styles.suggestionEmoji}>{s.icon}</Text>
            <Text style={[theme.typography.caption, { color: theme.colors.ivory, fontSize: 12 }]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════
//  MAIN SCREEN
// ═══════════════════════════════════════════════════════════
export default function AIChatScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { messages, loading, error, sendMessage, clearChat, loadChatHistory } = useAI();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef(null);
  const inputRef = useRef(null);

  // Load history on mount
  useEffect(() => {
    loadChatHistory();
  }, [loadChatHistory]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, loading]);

  const handleSend = useCallback(() => {
    if (!inputText.trim() || loading) return;
    const text = inputText.trim();
    setInputText('');
    sendMessage(text);
  }, [inputText, loading, sendMessage]);

  const handleSuggestion = useCallback((prompt) => {
    sendMessage(prompt);
  }, [sendMessage]);

  const handleClear = useCallback(() => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear all chat history?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearChat },
      ]
    );
  }, [clearChat]);

  const renderMessage = useCallback(({ item }) => (
    <MessageBubble message={item} theme={theme} />
  ), [theme]);

  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <View style={styles.container}>
      {/* Background */}
      <LinearGradient
        colors={[theme.colors.obsidian, '#0A0E1A', theme.colors.deepNavy]}
        style={StyleSheet.absoluteFill}
      />
      <FloatingParticles count={12} color={theme.colors.borderGold} />

      {/* ── HEADER ───────────────────────────────────────── */}
      <View style={[styles.header, { borderBottomColor: theme.colors.borderSilver }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.headerBtn, { backgroundColor: theme.colors.glassBg, borderColor: theme.colors.glassStroke }]}
        >
          <Ionicons name="chevron-back" size={22} color={theme.colors.gold} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="sparkles" size={16} color={theme.colors.gold} style={{ marginRight: 6 }} />
            <Text style={[theme.typography.headingS, { color: theme.colors.ivory }]}>
              TravelMate AI
            </Text>
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: theme.colors.emerald }]} />
            <Text style={[theme.typography.caption, { color: theme.colors.emerald, fontSize: 10 }]}>
              Online
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleClear}
          style={[styles.headerBtn, { backgroundColor: theme.colors.glassBg, borderColor: theme.colors.glassStroke }]}
        >
          <Ionicons name="trash-outline" size={20} color={theme.colors.ash} />
        </TouchableOpacity>
      </View>

      {/* ── CHAT AREA ────────────────────────────────────── */}
      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {messages.length === 0 && !loading ? (
          <EmptyState theme={theme} onSuggestionPress={handleSuggestion} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={loading ? <TypingIndicator theme={theme} /> : null}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        {/* ── INPUT BAR ──────────────────────────────────── */}
        <View style={[styles.inputBar, { borderTopColor: theme.colors.borderSilver, paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 14) : insets.bottom + 14 }]}>
          <View style={[styles.inputWrapper, { backgroundColor: theme.colors.glassBg, borderColor: theme.colors.borderGold }]}>
            <TextInput
              ref={inputRef}
              style={[styles.textInput, theme.typography.body, { color: theme.colors.ivory }]}
              placeholder="Ask about any destination..."
              placeholderTextColor={theme.colors.ash}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={2000}
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
              returnKeyType="send"
              editable={!loading}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!inputText.trim() || loading}
              activeOpacity={0.7}
              style={[
                styles.sendButton,
                {
                  backgroundColor: inputText.trim() && !loading
                    ? theme.colors.gold
                    : 'rgba(201, 168, 76, 0.15)',
                },
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color={theme.colors.gold} />
              ) : (
                <Ionicons
                  name="send"
                  size={18}
                  color={inputText.trim() ? '#0D0D0D' : theme.colors.goldMuted}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 6, height: 6, borderRadius: 3,
    marginRight: 4,
  },

  // Chat area
  chatArea: { flex: 1 },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },

  // User message
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  userBubble: {
    maxWidth: SCREEN_W * 0.75,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderBottomRightRadius: 6,
  },
  userText: {
    color: '#0D0D0D',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },

  // AI message
  aiRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  aiAvatar: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 4,
  },
  aiBubbleOuter: {
    maxWidth: SCREEN_W * 0.75,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
  },
  aiBubble: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  timestamp: {
    marginTop: 6,
    textAlign: 'right',
    fontSize: 10,
  },

  // Typing indicator
  typingRow: {
    flexDirection: 'row',
    marginBottom: 12,
    marginLeft: 36, // account for avatar space
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 7, height: 7, borderRadius: 3.5,
  },

  // Error
  errorRow: {
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  errorBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    maxWidth: SCREEN_W * 0.85,
  },

  // Input bar
  inputBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 1,
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 4,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 15,
  },
  sendButton: {
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 1,
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 1,
    overflow: 'hidden',
  },
  emptyIconGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 10,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  suggestionEmoji: {
    fontSize: 14,
  },
});
