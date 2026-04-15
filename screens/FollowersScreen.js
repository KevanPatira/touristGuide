// screens/FollowersScreen.js — List of followers / following / follow requests
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Image, ActivityIndicator, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  collection, query, where, getDocs, doc, getDoc, onSnapshot,
} from 'firebase/firestore';
import { db } from '../constants/firebaseConfig';
import { useAuth } from '../constants/AuthContext';
import { useTheme } from '../constants/ThemeContext';
import useFollow from '../hooks/useFollow';

import GlassCard from '../components/ui/GlassCard';
import PressableGoldButton from '../components/ui/PressableGoldButton';
import FloatingParticles from '../components/ui/FloatingParticles';

// ═══ Single User Row ═══
function UserRow({ userId, navigation, theme, isRequest, onAccept, onDecline }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDoc(doc(db, 'users', userId));
      if (snap.exists()) {
        setProfile({ uid: userId, ...snap.data() });
      }
    };
    fetch();
  }, [userId]);

  if (!profile) {
    return (
      <View style={styles.userRow}>
        <ActivityIndicator size="small" color={theme.colors.gold} />
      </View>
    );
  }

  const initials = profile.displayName
    ? profile.displayName[0].toUpperCase()
    : '?';

  return (
    <TouchableOpacity
      style={styles.userRow}
      onPress={() => navigation.navigate('UserProfile', { userId })}
      activeOpacity={0.7}
    >
      <View style={[styles.avatar, { backgroundColor: theme.colors.copper + '44' }]}>
        {profile.avatarUrl ? (
          <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImg} />
        ) : (
          <Text style={{ color: theme.colors.copper, fontSize: 16, fontWeight: 'bold' }}>
            {initials}
          </Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[theme.typography.body, { color: theme.colors.ivory }]}>
          {profile.displayName}
        </Text>
        <Text style={[theme.typography.caption, { color: theme.colors.parchment }]}>
          @{profile.username}
        </Text>
      </View>

      {isRequest && (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={[styles.reqBtn, { backgroundColor: theme.colors.gold }]}
            onPress={() => onAccept?.(userId)}
          >
            <Ionicons name="checkmark" size={18} color={theme.colors.obsidian} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.reqBtn, { backgroundColor: theme.colors.midnight, borderWidth: 1, borderColor: theme.colors.borderSilver }]}
            onPress={() => onDecline?.(userId)}
          >
            <Ionicons name="close" size={18} color={theme.colors.parchment} />
          </TouchableOpacity>
        </View>
      )}

      {!isRequest && (
        <Ionicons name="chevron-forward" size={18} color={theme.colors.ash} />
      )}
    </TouchableOpacity>
  );
}

// ═══ Main Screen ═══
export default function FollowersScreen({ route, navigation }) {
  const { userId, tab: initialTab, displayName } = route.params;
  const { theme } = useTheme();
  const { user } = useAuth();
  const isOwnProfile = user?.uid === userId;

  const [activeTab, setActiveTab] = useState(initialTab || 'followers');
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const { acceptFollowRequest, declineFollowRequest } = useFollow(user?.uid, null);

  // ═══ Fetch followers ═══
  useEffect(() => {
    setLoading(true);

    // Followers: who follows this user
    const followsRef = collection(db, 'follows');
    const followersQ = query(
      followsRef,
      where('followingId', '==', userId),
      where('status', '==', 'accepted')
    );

    const unsub1 = onSnapshot(followersQ, (snap) => {
      setFollowers(snap.docs.map(d => d.data().followerId));
      setLoading(false);
    });

    // Following: who this user follows
    const followingQ = query(
      followsRef,
      where('followerId', '==', userId),
      where('status', '==', 'accepted')
    );

    const unsub2 = onSnapshot(followingQ, (snap) => {
      setFollowing(snap.docs.map(d => d.data().followingId));
    });

    // Pending requests (only for own profile)
    if (isOwnProfile) {
      const requestsQ = query(
        followsRef,
        where('followingId', '==', userId),
        where('status', '==', 'pending')
      );
      const unsub3 = onSnapshot(requestsQ, (snap) => {
        setRequests(snap.docs.map(d => d.data().followerId));
      });
      return () => { unsub1(); unsub2(); unsub3(); };
    }

    return () => { unsub1(); unsub2(); };
  }, [userId]);

  const tabs = isOwnProfile
    ? [
        { key: 'followers', label: `Followers (${followers.length})` },
        { key: 'following', label: `Following (${following.length})` },
        { key: 'requests', label: `Requests (${requests.length})` },
      ]
    : [
        { key: 'followers', label: `Followers (${followers.length})` },
        { key: 'following', label: `Following (${following.length})` },
      ];

  const currentList = activeTab === 'followers'
    ? followers
    : activeTab === 'following'
    ? following
    : requests;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.obsidian }]}>
      <FloatingParticles count={5} />

      {/* Header */}
      <View style={[styles.headerArea, { backgroundColor: theme.colors.midnight }]}>
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.ivory} />
          </TouchableOpacity>
          <Text style={[theme.typography.headingS, { color: theme.colors.ivory }]} numberOfLines={1}>
            {displayName || 'Connections'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {tabs.map((t) => {
            const isActive = activeTab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[
                  styles.tabChip,
                  { borderColor: theme.colors.goldMuted },
                  isActive && { backgroundColor: theme.colors.gold },
                ]}
                onPress={() => setActiveTab(t.key)}
              >
                <Text style={[theme.typography.caption, {
                  color: isActive ? theme.colors.obsidian : theme.colors.gold,
                  fontWeight: '600',
                }]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Search */}
        <View style={[styles.searchRow, { backgroundColor: theme.colors.obsidian, borderColor: theme.colors.borderSilver }]}>
          <Ionicons name="search" size={18} color={theme.colors.ash} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search..."
            placeholderTextColor={theme.colors.ash}
            style={[theme.typography.body, { flex: 1, color: theme.colors.ivory }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.gold} />
        </View>
      ) : currentList.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="people-outline" size={48} color={theme.colors.ash} />
          <Text style={[theme.typography.body, { color: theme.colors.ash, marginTop: 12 }]}>
            {activeTab === 'requests' ? 'No pending requests' : 'No users found'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <UserRow
              userId={item}
              navigation={navigation}
              theme={theme}
              isRequest={activeTab === 'requests'}
              onAccept={acceptFollowRequest}
              onDecline={declineFollowRequest}
            />
          )}
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
    marginBottom: 16,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12, overflow: 'hidden',
  },
  avatarImg: { width: 44, height: 44, borderRadius: 22 },
  reqBtn: {
    width: 34, height: 34, borderRadius: 17,
    justifyContent: 'center', alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
