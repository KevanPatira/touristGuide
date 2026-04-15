// screens/DiscoverScreen.js — Search users and see trending posts
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, Image, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  collection, query, where, orderBy, limit, getDocs, onSnapshot
} from 'firebase/firestore';
import { db } from '../constants/firebaseConfig';
import { useAuth } from '../constants/AuthContext';
import { useTheme } from '../constants/ThemeContext';

import GlassCard from '../components/ui/GlassCard';
import FloatingParticles from '../components/ui/FloatingParticles';

export default function DiscoverScreen({ navigation }) {
  const { theme } = useTheme();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [trendingPosts, setTrendingPosts] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);

  // ═══ Search Users ═══
  const handleSearch = async (text) => {
    setSearchQuery(text);
    if (text.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const usersRef = collection(db, 'users');
      // Search by username prefix
      const q = query(
        usersRef,
        where('username', '>=', text.toLowerCase()),
        where('username', '<=', text.toLowerCase() + '\uf8ff')
      );
      const snapshot = await getDocs(q);
      const results = snapshot.docs
        .map(d => ({ uid: d.id, ...d.data() }))
        .filter(u => u.uid !== user?.uid);
      setSearchResults(results);
    } catch (_) {}
    setSearching(false);
  };

  // ═══ Fetch Trending Posts ═══
  useEffect(() => {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('likes', 'desc'), limit(10));

    const unsub = onSnapshot(q, (snapshot) => {
      setTrendingPosts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoadingTrending(false);
    });

    return unsub;
  }, []);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // ═══ Render User Result ═══
  const renderUser = ({ item }) => {
    const initials = item.displayName ? item.displayName[0].toUpperCase() : '?';
    return (
      <TouchableOpacity
        style={styles.userRow}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('UserProfile', { userId: item.uid })}
      >
        <View style={[styles.avatar, { backgroundColor: theme.colors.copper + '44' }]}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.avatarImg} />
          ) : (
            <Text style={{ color: theme.colors.copper, fontSize: 18, fontWeight: 'bold' }}>{initials}</Text>
          )}
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[theme.typography.body, { color: theme.colors.ivory, fontWeight: '600' }]}>
            {item.displayName}
          </Text>
          <Text style={[theme.typography.caption, { color: theme.colors.parchment }]}>
            @{item.username} • {item.followerCount || 0} followers
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.ash} />
      </TouchableOpacity>
    );
  };

  // ═══ Render Trending Post ═══
  const renderPost = ({ item, index }) => (
    <GlassCard style={styles.postCard} glowOnPress={false}>
      <TouchableOpacity
        style={styles.postHeader}
        onPress={() => item.authorId !== user?.uid && navigation.navigate('UserProfile', { userId: item.authorId })}
      >
        <Text style={[theme.typography.label, { color: theme.colors.gold }]}>
          #{index + 1} Trending
        </Text>
        <Text style={[theme.typography.caption, { color: theme.colors.parchment }]}>
          {item.likes || 0} Likes
        </Text>
      </TouchableOpacity>
      <Text style={[theme.typography.body, { color: theme.colors.ivory, marginTop: 8 }]} numberOfLines={3}>
        {item.text}
      </Text>
      <View style={styles.postFooter}>
        <Text style={[theme.typography.caption, { color: theme.colors.parchment }]}>
          By {item.authorName} • {formatTime(item.createdAt)}
        </Text>
      </View>
    </GlassCard>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.obsidian }]}>
      <FloatingParticles count={3} />

      {/* Header & Search */}
      <View style={[styles.headerArea, { backgroundColor: theme.colors.midnight, borderBottomColor: theme.colors.borderSilver }]}>
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.ivory} />
          </TouchableOpacity>
          <Text style={[theme.typography.headingS, { color: theme.colors.ivory, flex: 1 }]}>
            Discover
          </Text>
        </View>
        
        <View style={[styles.searchBar, { backgroundColor: theme.colors.obsidian, borderColor: theme.colors.borderSilver }]}>
          <Ionicons name="search" size={18} color={theme.colors.ash} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search users by username..."
            placeholderTextColor={theme.colors.ash}
            style={[theme.typography.body, { flex: 1, color: theme.colors.ivory }]}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searching && <ActivityIndicator size="small" color={theme.colors.gold} />}
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {searchQuery.length > 0 ? (
          // Search Results
          <FlatList
            data={searchResults}
            keyExtractor={item => item.uid}
            renderItem={renderUser}
            contentContainerStyle={{ padding: 20 }}
            ListEmptyComponent={
              !searching && (
                <Text style={[theme.typography.body, { color: theme.colors.ash, textAlign: 'center', marginTop: 40 }]}>
                  No users found matching "{searchQuery}"
                </Text>
              )
            }
          />
        ) : (
          // Trending Posts
          <FlatList
            data={trendingPosts}
            keyExtractor={item => item.id}
            renderItem={renderPost}
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            ListHeaderComponent={
              <Text style={[theme.typography.headingS, { color: theme.colors.ivory, marginBottom: 16 }]}>
                Trending Globally
              </Text>
            }
            ListEmptyComponent={
              loadingTrending ? (
                <ActivityIndicator size="large" color={theme.colors.gold} style={{ marginTop: 40 }} />
              ) : (
                <Text style={[theme.typography.body, { color: theme.colors.ash, textAlign: 'center', marginTop: 40 }]}>
                  No trending posts yet.
                </Text>
              )
            }
          />
        )}
      </View>
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
    borderBottomWidth: 1,
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 48, height: 48, borderRadius: 24 },
  postCard: { padding: 16, marginBottom: 12 },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
});
