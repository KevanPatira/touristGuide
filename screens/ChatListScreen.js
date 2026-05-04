// screens/ChatListScreen.js — MongoDB-backed chat list + user search
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Image, TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../constants/AuthContext';
import { useTheme } from '../constants/ThemeContext';
import useChatList from '../hooks/useChatList';
import * as chatService from '../services/chat.service';

import GlassCard from '../components/ui/GlassCard';
import FloatingParticles from '../components/ui/FloatingParticles';

export default function ChatListScreen({ navigation }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { chats, loading } = useChatList(user?.uid);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // ═══ Search for users via MongoDB API ═══
  const handleSearch = async (text) => {
    setSearchQuery(text);
    if (text.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await chatService.searchUsers(text.trim());
      setSearchResults(res.data || []);
    } catch (_) {}
    setSearching(false);
  };

  // ═══ Open or create chat with a user (via MongoDB API) ═══
  const openChatWith = async (otherUser) => {
    try {
      const res = await chatService.createOrGetChat(otherUser.uid);
      setShowSearch(false);
      setSearchQuery('');
      setSearchResults([]);
      navigation.navigate('Chat', {
        chatId: res.data.chatId,
        otherUserId: otherUser.uid,
        otherUserName: otherUser.displayName || 'Traveler',
        otherUserAvatar: otherUser.avatarUrl || '',
      });
    } catch (e) {
      console.log('Open chat error:', e);
    }
  };

  // ═══ Format timestamp ═══
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // ═══ Chat Row ═══
  const renderChatItem = ({ item }) => {
    const initials = item.otherUserName
      ? item.otherUserName[0].toUpperCase()
      : '?';

    return (
      <TouchableOpacity
        style={styles.chatRow}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('Chat', {
          chatId: item.id,
          otherUserId: item.otherUserId,
          otherUserName: item.otherUserName,
          otherUserAvatar: item.otherUserAvatar,
        })}
      >
        <View style={[styles.avatar, { backgroundColor: theme.colors.copper + '44' }]}>
          {item.otherUserAvatar ? (
            <Image source={{ uri: item.otherUserAvatar }} style={styles.avatarImg} />
          ) : (
            <Text style={{ color: theme.colors.copper, fontSize: 18, fontWeight: 'bold' }}>
              {initials}
            </Text>
          )}
        </View>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[theme.typography.body, { color: theme.colors.ivory, fontWeight: '600' }]} numberOfLines={1}>
              {item.otherUserName}
            </Text>
            <Text style={[theme.typography.caption, { color: theme.colors.ash, fontSize: 11 }]}>
              {formatTime(item.lastMessageAt)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[theme.typography.caption, { color: theme.colors.parchment, marginTop: 3, flex: 1 }]} numberOfLines={1}>
              {item.lastMessage || 'Start a conversation...'}
            </Text>
            {item.unreadCount > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: theme.colors.gold }]}>
                <Text style={{ color: theme.colors.obsidian, fontSize: 10, fontWeight: 'bold' }}>
                  {item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ═══ Search Result Row ═══
  const renderSearchResult = ({ item }) => {
    const initials = item.displayName ? item.displayName[0].toUpperCase() : '?';
    return (
      <TouchableOpacity
        style={styles.chatRow}
        activeOpacity={0.7}
        onPress={() => openChatWith(item)}
      >
        <View style={[styles.avatar, { backgroundColor: theme.colors.copper + '44' }]}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.avatarImg} />
          ) : (
            <Text style={{ color: theme.colors.copper, fontSize: 18, fontWeight: 'bold' }}>
              {initials}
            </Text>
          )}
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[theme.typography.body, { color: theme.colors.ivory, fontWeight: '600' }]}>
            {item.displayName}
          </Text>
          <Text style={[theme.typography.caption, { color: theme.colors.parchment }]}>
            @{item.username}
          </Text>
        </View>
        <View style={[styles.newChatBadge, { backgroundColor: theme.colors.gold + '22' }]}>
          <Ionicons name="chatbubble-outline" size={14} color={theme.colors.gold} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.obsidian }]}>
      <FloatingParticles count={5} />

      {/* Header */}
      <View style={[styles.headerArea, { backgroundColor: theme.colors.midnight }]}>
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.ivory} />
          </TouchableOpacity>
          <Text style={[theme.typography.headingS, { color: theme.colors.ivory, flex: 1, textAlign: 'center' }]}>
            Messages
          </Text>
          <TouchableOpacity
            onPress={() => setShowSearch(!showSearch)}
            style={styles.backBtn}
          >
            <Ionicons
              name={showSearch ? 'close' : 'create-outline'}
              size={22}
              color={theme.colors.gold}
            />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        {showSearch && (
          <View style={[styles.searchRow, { backgroundColor: theme.colors.obsidian, borderColor: theme.colors.borderSilver }]}>
            <Ionicons name="search" size={18} color={theme.colors.ash} style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Search users by name or username..."
              placeholderTextColor={theme.colors.ash}
              style={[theme.typography.body, { flex: 1, color: theme.colors.ivory }]}
              value={searchQuery}
              onChangeText={handleSearch}
              autoFocus
            />
            {searching && <ActivityIndicator size="small" color={theme.colors.gold} />}
          </View>
        )}
      </View>

      {/* Search Results OR Chat List */}
      {showSearch && searchResults.length > 0 ? (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.uid}
          renderItem={renderSearchResult}
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
        />
      ) : loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.gold} />
        </View>
      ) : chats.length === 0 ? (
        <View style={styles.centered}>
          <GlassCard style={styles.emptyCard} glowOnPress={false}>
            <Ionicons name="chatbubbles-outline" size={48} color={theme.colors.gold} />
            <Text style={[theme.typography.headingS, { color: theme.colors.gold, marginTop: 16 }]}>
              No conversations yet
            </Text>
            <Text style={[theme.typography.body, { color: theme.colors.parchment, textAlign: 'center', marginTop: 8 }]}>
              Tap the ✏️ icon above to search for travelers and start chatting!
            </Text>
          </GlassCard>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={renderChatItem}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerArea: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    zIndex: 10,
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  avatar: {
    width: 50, height: 50, borderRadius: 25,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 50, height: 50, borderRadius: 25 },
  newChatBadge: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  unreadBadge: {
    minWidth: 18, height: 18, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4, marginLeft: 8,
  },
  centered: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  emptyCard: {
    padding: 32, alignItems: 'center', width: '100%',
  },
});
