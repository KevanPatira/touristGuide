// screens/DiscoverScreen.js — MongoDB-backed search + trending
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../constants/AuthContext';
import { useTheme } from '../constants/ThemeContext';
import * as chatService from '../services/chat.service';
import * as postService from '../services/post.service';
import GlassCard from '../components/ui/GlassCard';
import FloatingParticles from '../components/ui/FloatingParticles';
import styles from './styles/DiscoverScreen.styles';

export default function DiscoverScreen({ navigation }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);

  // Search users via MongoDB API
  const handleSearch = async (text) => {
    setSearchQuery(text);
    if (text.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await chatService.searchUsers(text.trim());
      setSearchResults(res.data || []);
    } catch (_) {}
    setSearching(false);
  };

  // Fetch trending posts from MongoDB
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await postService.getPosts('popular', 1, 10);
        setTrendingPosts(res.data || []);
      } catch (e) { console.log('Trending error:', e); }
      setLoadingTrending(false);
    };
    fetchTrending();
  }, []);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderUser = ({ item }) => {
    const initials = item.displayName ? item.displayName[0].toUpperCase() : '?';
    return (
      <TouchableOpacity style={styles.userRow} activeOpacity={0.7} onPress={() => navigation.navigate('UserProfile', { userId: item.uid })}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.copper + '44' }]}>
          {item.avatarUrl ? <Image source={{ uri: item.avatarUrl }} style={styles.avatarImg} /> : <Text style={{ color: theme.colors.copper, fontSize: 18, fontWeight: 'bold' }}>{initials}</Text>}
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[theme.typography.body, { color: theme.colors.ivory, fontWeight: '600' }]}>{item.displayName}</Text>
          <Text style={[theme.typography.caption, { color: theme.colors.parchment }]}>@{item.username}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.ash} />
      </TouchableOpacity>
    );
  };

  const renderPost = ({ item, index }) => (
    <GlassCard style={styles.postCard} glowOnPress={false}>
      <TouchableOpacity style={styles.postHeader} onPress={() => { const aid = item.authorIdStr || item.authorId; if (aid && aid !== user?.uid) navigation.navigate('UserProfile', { userId: aid }); }}>
        <Text style={[theme.typography.label, { color: theme.colors.gold }]}>#{index + 1} Trending</Text>
        <Text style={[theme.typography.caption, { color: theme.colors.parchment }]}>{item.likes || 0} Likes</Text>
      </TouchableOpacity>
      <Text style={[theme.typography.body, { color: theme.colors.ivory, marginTop: 8 }]} numberOfLines={3}>{item.text}</Text>
      <View style={styles.postFooter}>
        <Text style={[theme.typography.caption, { color: theme.colors.parchment }]}>By {item.authorName} • {formatTime(item.createdAt)}</Text>
      </View>
    </GlassCard>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.obsidian }]}>
      <FloatingParticles count={3} />
      <View style={[styles.headerArea, { backgroundColor: theme.colors.midnight, borderBottomColor: theme.colors.borderSilver }]}>
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={theme.colors.ivory} /></TouchableOpacity>
          <Text style={[theme.typography.headingS, { color: theme.colors.ivory, flex: 1 }]}>Discover</Text>
        </View>
        <View style={[styles.searchBar, { backgroundColor: theme.colors.obsidian, borderColor: theme.colors.borderSilver }]}>
          <Ionicons name="search" size={18} color={theme.colors.ash} style={{ marginRight: 8 }} />
          <TextInput placeholder="Search users by name or username..." placeholderTextColor={theme.colors.ash} style={[theme.typography.body, { flex: 1, color: theme.colors.ivory }]} value={searchQuery} onChangeText={handleSearch} />
          {searching && <ActivityIndicator size="small" color={theme.colors.gold} />}
        </View>
      </View>
      <View style={{ flex: 1 }}>
        {searchQuery.length > 0 ? (
          <FlatList data={searchResults} keyExtractor={item => item.uid} renderItem={renderUser} contentContainerStyle={{ padding: 20 }} ListEmptyComponent={!searching && <Text style={[theme.typography.body, { color: theme.colors.ash, textAlign: 'center', marginTop: 40 }]}>No users found matching "{searchQuery}"</Text>} />
        ) : (
          <FlatList data={trendingPosts} keyExtractor={item => item._id || item.id} renderItem={renderPost} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} ListHeaderComponent={<Text style={[theme.typography.headingS, { color: theme.colors.ivory, marginBottom: 16 }]}>Trending Globally</Text>} ListEmptyComponent={loadingTrending ? <ActivityIndicator size="large" color={theme.colors.gold} style={{ marginTop: 40 }} /> : <Text style={[theme.typography.body, { color: theme.colors.ash, textAlign: 'center', marginTop: 40 }]}>No trending posts yet.</Text>} />
        )}
      </View>
    </View>
  );
}

