// screens/ChatScreen.js — 1-on-1 real-time chat
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, Image, KeyboardAvoidingView, Platform,
  ActivityIndicator, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../constants/AuthContext';
import { useTheme } from '../constants/ThemeContext';
import useChat from '../hooks/useChat';
import FloatingParticles from '../components/ui/FloatingParticles';

export default function ChatScreen({ route, navigation }) {
  const { chatId, otherUserId, otherUserName, otherUserAvatar } = route.params;
  const { theme } = useTheme();
  const { user } = useAuth();
  const { messages, loading, sendMessage } = useChat(chatId, user?.uid);

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);

  // ═══ Send handler ═══
  const handleSend = async () => {
    if (!text.trim()) return;
    const msg = text;
    setText('');
    setSending(true);
    try {
      await sendMessage(msg, otherUserId);
    } catch (e) {
      console.log('Send error:', e);
    }
    setSending(false);
  };

  // ═══ Format time ═══
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDateHeader = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // ═══ Check if should show date header ═══
  const shouldShowDate = (index) => {
    if (index === messages.length - 1) return true; // Last message (oldest since reversed)
    const current = messages[index]?.createdAt;
    const next = messages[index + 1]?.createdAt;
    if (!current || !next) return false;
    const currentDate = (current.toDate ? current.toDate() : new Date(current)).toDateString();
    const nextDate = (next.toDate ? next.toDate() : new Date(next)).toDateString();
    return currentDate !== nextDate;
  };

  const initials = otherUserName ? otherUserName[0].toUpperCase() : '?';

  // ═══ Message Bubble ═══
  const renderMessage = ({ item, index }) => {
    const isMe = item.senderId === user?.uid;
    const showDate = shouldShowDate(index);

    return (
      <View>
        {showDate && (
          <View style={styles.dateHeader}>
            <View style={[styles.datePill, { backgroundColor: theme.colors.midnight }]}>
              <Text style={[theme.typography.caption, { color: theme.colors.parchment, fontSize: 11 }]}>
                {formatDateHeader(item.createdAt)}
              </Text>
            </View>
          </View>
        )}

        <View style={[
          styles.bubbleRow,
          isMe ? styles.bubbleRowRight : styles.bubbleRowLeft,
        ]}>
          {/* Other user avatar (only for first in group) */}
          {!isMe && (
            <View style={[styles.bubbleAvatar, { backgroundColor: theme.colors.copper + '33' }]}>
              {otherUserAvatar ? (
                <Image source={{ uri: otherUserAvatar }} style={styles.bubbleAvatarImg} />
              ) : (
                <Text style={{ color: theme.colors.copper, fontSize: 10, fontWeight: 'bold' }}>
                  {initials}
                </Text>
              )}
            </View>
          )}

          <View style={[
            styles.bubble,
            isMe
              ? { backgroundColor: theme.colors.gold + '22', borderColor: theme.colors.gold + '44', borderBottomRightRadius: 4 }
              : { backgroundColor: theme.colors.midnight, borderColor: theme.colors.borderSilver, borderBottomLeftRadius: 4 },
          ]}>
            <Text style={[theme.typography.body, {
              color: isMe ? theme.colors.ivory : theme.colors.ivory,
              fontSize: 14,
            }]}>
              {item.text}
            </Text>
            <Text style={[styles.timeText, {
              color: isMe ? theme.colors.goldMuted : theme.colors.ash,
            }]}>
              {formatMessageTime(item.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.obsidian }]}>
      <FloatingParticles count={3} />

      {/* Header */}
      <View style={[styles.headerArea, { backgroundColor: theme.colors.midnight }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.ivory} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerProfile}
          onPress={() => navigation.navigate('UserProfile', { userId: otherUserId })}
          activeOpacity={0.7}
        >
          <View style={[styles.headerAvatar, { backgroundColor: theme.colors.copper + '44' }]}>
            {otherUserAvatar ? (
              <Image source={{ uri: otherUserAvatar }} style={styles.headerAvatarImg} />
            ) : (
              <Text style={{ color: theme.colors.copper, fontSize: 14, fontWeight: 'bold' }}>
                {initials}
              </Text>
            )}
          </View>
          <View>
            <Text style={[theme.typography.body, { color: theme.colors.ivory, fontWeight: '600' }]} numberOfLines={1}>
              {otherUserName}
            </Text>
            <Text style={[theme.typography.caption, { color: theme.colors.parchment, fontSize: 11 }]}>
              Tap to view profile
            </Text>
          </View>
        </TouchableOpacity>

        <View style={{ width: 40 }} />
      </View>

      {/* Messages */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.gold} />
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          inverted
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Ionicons name="chatbubble-ellipses-outline" size={40} color={theme.colors.ash} />
              <Text style={[theme.typography.body, { color: theme.colors.ash, marginTop: 12, textAlign: 'center' }]}>
                No messages yet.{'\n'}Say hello to {otherUserName}! 👋
              </Text>
            </View>
          }
        />
      )}

      {/* Input Bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.inputBar, { backgroundColor: theme.colors.midnight, borderTopColor: theme.colors.borderSilver }]}>
          <TextInput
            ref={inputRef}
            style={[theme.typography.body, styles.input, {
              backgroundColor: theme.colors.obsidian,
              color: theme.colors.ivory,
              borderColor: theme.colors.borderSilver,
            }]}
            placeholder="Type a message..."
            placeholderTextColor={theme.colors.ash}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
          />

          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: text.trim() ? theme.colors.gold : theme.colors.midnight },
            ]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
            activeOpacity={0.7}
          >
            {sending ? (
              <ActivityIndicator size="small" color={theme.colors.obsidian} />
            ) : (
              <Ionicons
                name="send"
                size={18}
                color={text.trim() ? theme.colors.obsidian : theme.colors.ash}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerArea: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    zIndex: 10,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerProfile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAvatar: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  headerAvatarImg: { width: 36, height: 36, borderRadius: 18 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyChat: {
    alignItems: 'center', paddingVertical: 60,
    // inverted list, so this appears at the center
    transform: [{ scaleY: -1 }],
  },
  dateHeader: {
    alignItems: 'center',
    marginVertical: 12,
  },
  datePill: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 6,
    maxWidth: '82%',
  },
  bubbleRowRight: { alignSelf: 'flex-end' },
  bubbleRowLeft: { alignSelf: 'flex-start' },
  bubbleAvatar: {
    width: 24, height: 24, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 6, marginTop: 4,
    overflow: 'hidden',
  },
  bubbleAvatarImg: { width: 24, height: 24, borderRadius: 12 },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    borderTopWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    borderWidth: 1,
  },
  sendBtn: {
    width: 42, height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
