// screens/FollowersScreen.js — MongoDB-backed followers/following list
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Image, ActivityIndicator, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../constants/AuthContext';
import { useTheme } from '../constants/ThemeContext';
import useFollow from '../hooks/useFollow';
import * as followService from '../services/follow.service';
import FloatingParticles from '../components/ui/FloatingParticles';

function UserRow({ user: rowUser, navigation, theme }) {
  if (!rowUser) return null;
  const initials = rowUser.displayName ? rowUser.displayName[0].toUpperCase() : '?';
  return (
    <TouchableOpacity style={styles.userRow} onPress={() => navigation.navigate('UserProfile', { userId: rowUser.uid })} activeOpacity={0.7}>
      <View style={[styles.avatar, { backgroundColor: theme.colors.copper + '44' }]}>
        {rowUser.avatarUrl ? <Image source={{ uri: rowUser.avatarUrl }} style={styles.avatarImg} /> : <Text style={{ color: theme.colors.copper, fontSize: 16, fontWeight: 'bold' }}>{initials}</Text>}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[theme.typography.body, { color: theme.colors.ivory }]}>{rowUser.displayName}</Text>
        <Text style={[theme.typography.caption, { color: theme.colors.parchment }]}>@{rowUser.username}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.ash} />
    </TouchableOpacity>
  );
}

export default function FollowersScreen({ route, navigation }) {
  const { userId, tab: initialTab, displayName } = route.params;
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState(initialTab || 'followers');
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [fRes, gRes] = await Promise.all([followService.getFollowers(userId, 1, 50), followService.getFollowing(userId, 1, 50)]);
        setFollowers(fRes.data || []);
        setFollowing(gRes.data || []);
      } catch (e) { console.log('Fetch error:', e); }
      setLoading(false);
    };
    fetchData();
  }, [userId]);

  const tabs = [{ key: 'followers', label: `Followers (${followers.length})` }, { key: 'following', label: `Following (${following.length})` }];
  const currentList = activeTab === 'followers' ? followers : following;
  const filteredList = searchQuery.trim() ? currentList.filter(u => (u.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) || (u.username || '').toLowerCase().includes(searchQuery.toLowerCase())) : currentList;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.obsidian }]}>
      <FloatingParticles count={5} />
      <View style={[styles.headerArea, { backgroundColor: theme.colors.midnight }]}>
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={theme.colors.ivory} /></TouchableOpacity>
          <Text style={[theme.typography.headingS, { color: theme.colors.ivory }]} numberOfLines={1}>{displayName || 'Connections'}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.tabRow}>
          {tabs.map(t => { const isActive = activeTab === t.key; return (<TouchableOpacity key={t.key} style={[styles.tabChip, { borderColor: theme.colors.goldMuted }, isActive && { backgroundColor: theme.colors.gold }]} onPress={() => setActiveTab(t.key)}><Text style={[theme.typography.caption, { color: isActive ? theme.colors.obsidian : theme.colors.gold, fontWeight: '600' }]}>{t.label}</Text></TouchableOpacity>); })}
        </View>
        <View style={[styles.searchRow, { backgroundColor: theme.colors.obsidian, borderColor: theme.colors.borderSilver }]}>
          <Ionicons name="search" size={18} color={theme.colors.ash} style={{ marginRight: 8 }} />
          <TextInput placeholder="Search..." placeholderTextColor={theme.colors.ash} style={[theme.typography.body, { flex: 1, color: theme.colors.ivory }]} value={searchQuery} onChangeText={setSearchQuery} />
        </View>
      </View>
      {loading ? (<View style={styles.centered}><ActivityIndicator size="large" color={theme.colors.gold} /></View>
      ) : filteredList.length === 0 ? (<View style={styles.centered}><Ionicons name="people-outline" size={48} color={theme.colors.ash} /><Text style={[theme.typography.body, { color: theme.colors.ash, marginTop: 12 }]}>No users found</Text></View>
      ) : (<FlatList data={filteredList} keyExtractor={item => item.uid || item._id} renderItem={({ item }) => <UserRow user={item} navigation={navigation} theme={theme} />} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerArea: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 16, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, zIndex: 10 },
  headerNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  tabRow: { flexDirection: 'row', marginBottom: 12 },
  tabChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8, borderWidth: 1 },
  searchRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  userRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.06)' },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden' },
  avatarImg: { width: 44, height: 44, borderRadius: 22 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
