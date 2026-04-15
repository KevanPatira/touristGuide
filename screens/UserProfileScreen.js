// screens/UserProfileScreen.js — View another user's profile
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Image, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  doc, getDoc, collection, query, where, orderBy, onSnapshot, limit,
} from 'firebase/firestore';
import { db } from '../constants/firebaseConfig';
import { useAuth } from '../constants/AuthContext';
import { useTheme } from '../constants/ThemeContext';
import useFollow from '../hooks/useFollow';
import { getChatId } from '../hooks/useChat';

import GlassCard from '../components/ui/GlassCard';
import PressableGoldButton from '../components/ui/PressableGoldButton';
import FloatingParticles from '../components/ui/FloatingParticles';

export default function UserProfileScreen({ route, navigation }) {
  const { userId } = route.params;
  const { theme } = useTheme();
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const {
    followStatus, // 'none' | 'pending' | 'following'
    loading: followLoading,
    followUser,
    unfollowUser,
  } = useFollow(user?.uid, userId);

  // ═══ Fetch user profile ═══
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'users', userId));
        if (docSnap.exists()) {
          setProfile({ uid: userId, ...docSnap.data() });
        } else {
          Alert.alert('Error', 'User not found.');
          navigation.goBack();
        }
      } catch (e) {
        console.log('Profile fetch error:', e);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [userId]);

  // ═══ Fetch user's posts (only if public or following) ═══
  useEffect(() => {
    if (!profile) return;

    const canViewPosts = !profile.isPrivate || followStatus === 'following';
    if (!canViewPosts) {
      setPosts([]);
      return;
    }

    const postsRef = collection(db, 'posts');
    const q = query(
      postsRef,
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return unsub;
  }, [profile, followStatus, userId]);

  // ═══ Follow / Unfollow handler ═══
  const handleFollowToggle = async () => {
    if (followStatus === 'following' || followStatus === 'pending') {
      Alert.alert(
        followStatus === 'following' ? 'Unfollow' : 'Cancel Request',
        `Are you sure you want to ${followStatus === 'following' ? 'unfollow' : 'cancel the follow request for'} ${profile.displayName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Yes', style: 'destructive', onPress: () => unfollowUser() },
        ]
      );
    } else {
      await followUser(profile.isPrivate);
    }
  };

  // ═══ Follow button style ═══
  const getFollowButtonProps = () => {
    switch (followStatus) {
      case 'following':
        return { label: 'Following', variant: 'outline', icon: 'checkmark' };
      case 'pending':
        return { label: 'Requested', variant: 'outline', icon: 'time-outline' };
      default:
        return { label: 'Follow', variant: 'primary', icon: 'person-add-outline' };
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.obsidian, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.gold} />
      </View>
    );
  }

  if (!profile) return null;

  const initials = profile.displayName
    ? profile.displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const canViewPosts = !profile.isPrivate || followStatus === 'following';
  const btnProps = getFollowButtonProps();

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
            {profile.displayName}
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <FlatList
        data={canViewPosts ? posts : []}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View style={styles.profileSection}>
            {/* Avatar + Stats Row */}
            <View style={styles.profileTopRow}>
              <View style={[styles.avatar, { backgroundColor: theme.colors.copper }]}>
                {profile.avatarUrl ? (
                  <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.avatarText}>{initials}</Text>
                )}
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={[theme.typography.displayM, { color: theme.colors.gold }]}>
                    {profile.postCount || 0}
                  </Text>
                  <Text style={[theme.typography.caption, { color: theme.colors.parchment }]}>Posts</Text>
                </View>

                <TouchableOpacity
                  style={styles.statBox}
                  onPress={() => navigation.navigate('Followers', {
                    userId, tab: 'followers', displayName: profile.displayName
                  })}
                >
                  <Text style={[theme.typography.displayM, { color: theme.colors.gold }]}>
                    {profile.followerCount || 0}
                  </Text>
                  <Text style={[theme.typography.caption, { color: theme.colors.parchment }]}>Followers</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.statBox}
                  onPress={() => navigation.navigate('Followers', {
                    userId, tab: 'following', displayName: profile.displayName
                  })}
                >
                  <Text style={[theme.typography.displayM, { color: theme.colors.gold }]}>
                    {profile.followingCount || 0}
                  </Text>
                  <Text style={[theme.typography.caption, { color: theme.colors.parchment }]}>Following</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Name + Bio */}
            <Text style={[theme.typography.headingS, { color: theme.colors.ivory, marginTop: 16 }]}>
              {profile.displayName}
            </Text>
            <Text style={[theme.typography.caption, { color: theme.colors.parchment, marginTop: 2 }]}>
              @{profile.username}
            </Text>
            {profile.bio ? (
              <Text style={[theme.typography.body, { color: theme.colors.ivory, marginTop: 8 }]}>
                {profile.bio}
              </Text>
            ) : null}

            {/* Private badge */}
            {profile.isPrivate && (
              <View style={[styles.privateBadge, { backgroundColor: theme.colors.midnight }]}>
                <Ionicons name="lock-closed-outline" size={12} color={theme.colors.parchment} />
                <Text style={[theme.typography.caption, { color: theme.colors.parchment, fontSize: 11 }]}>
                  Private Account
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            {user?.uid !== userId && (
              <View style={styles.actionRow}>
                <PressableGoldButton
                  label={btnProps.label}
                  variant={btnProps.variant}
                  onPress={handleFollowToggle}
                  disabled={followLoading}
                  icon={<Ionicons name={btnProps.icon} size={16} color={followStatus === 'none' ? theme.colors.ivory : theme.colors.gold} />}
                  style={{ flex: 1 }}
                />
                {followStatus === 'following' && (
                  <TouchableOpacity
                    style={[styles.messageBtn, { backgroundColor: theme.colors.midnight, borderColor: theme.colors.borderSilver }]}
                    onPress={() => navigation.navigate('Chat', {
                      chatId: getChatId(user.uid, userId),
                      otherUserId: userId,
                      otherUserName: profile.displayName,
                      otherUserAvatar: profile.avatarUrl || '',
                    })}
                  >
                    <Ionicons name="chatbubble-outline" size={20} color={theme.colors.gold} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Private lock screen */}
            {!canViewPosts && profile.isPrivate && (
              <GlassCard style={styles.privateCard} glowOnPress={false}>
                <Ionicons name="lock-closed" size={40} color={theme.colors.ash} />
                <Text style={[theme.typography.headingS, { color: theme.colors.parchment, marginTop: 12 }]}>
                  This account is private
                </Text>
                <Text style={[theme.typography.body, { color: theme.colors.ash, textAlign: 'center', marginTop: 6 }]}>
                  Follow this account to see their posts and travel experiences.
                </Text>
              </GlassCard>
            )}

            {/* Posts header */}
            {canViewPosts && (
              <View style={[styles.postsHeader, { borderTopColor: theme.colors.borderSilver }]}>
                <Ionicons name="grid-outline" size={18} color={theme.colors.gold} />
                <Text style={[theme.typography.label, { color: theme.colors.gold, marginLeft: 8 }]}>
                  POSTS
                </Text>
              </View>
            )}
          </View>
        )}
        renderItem={({ item }) => (
          <GlassCard style={styles.postCard} glowOnPress={false}>
            <Text style={[theme.typography.body, { color: theme.colors.ivory }]}>{item.text}</Text>
            {item.imageUrl && (
              <Image source={{ uri: item.imageUrl }} style={styles.postImage} resizeMode="cover" />
            )}
            <View style={styles.postMeta}>
              <Text style={[theme.typography.caption, { color: theme.colors.parchment }]}>
                {formatTime(item.createdAt)} • {item.location || ''}
              </Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={styles.metaChip}>
                  <Ionicons name="heart" size={14} color={theme.colors.crimson} />
                  <Text style={[theme.typography.caption, { color: theme.colors.parchment, marginLeft: 4 }]}>
                    {item.likes || 0}
                  </Text>
                </View>
                <View style={styles.metaChip}>
                  <Ionicons name="chatbubble" size={14} color={theme.colors.parchment} />
                  <Text style={[theme.typography.caption, { color: theme.colors.parchment, marginLeft: 4 }]}>
                    {item.commentsCount || 0}
                  </Text>
                </View>
              </View>
            </View>
          </GlassCard>
        )}
        ListEmptyComponent={
          canViewPosts ? (
            <View style={styles.emptyPosts}>
              <Text style={[theme.typography.body, { color: theme.colors.ash }]}>
                No posts yet
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerArea: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    zIndex: 10,
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  profileSection: { marginBottom: 8 },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 76, height: 76, borderRadius: 38,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 76, height: 76, borderRadius: 38 },
  avatarText: { color: '#fff', fontSize: 26, fontWeight: '700' },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: 20,
  },
  statBox: { alignItems: 'center' },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 10,
    gap: 6,
    alignSelf: 'flex-start',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  messageBtn: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
  },
  privateCard: {
    padding: 32,
    alignItems: 'center',
    marginTop: 24,
  },
  postsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  postCard: { padding: 16, marginBottom: 12 },
  postImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginTop: 10,
  },
  postMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  metaChip: { flexDirection: 'row', alignItems: 'center' },
  emptyPosts: {
    alignItems: 'center',
    paddingVertical: 40,
  },
});
