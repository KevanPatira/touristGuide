// screens/NotificationsScreen.js — View and manage notifications
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Image, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../constants/firebaseConfig';
import { useAuth } from '../constants/AuthContext';
import { useTheme } from '../constants/ThemeContext';
import useNotifications from '../hooks/useNotifications';
import useFollow from '../hooks/useFollow';

import GlassCard from '../components/ui/GlassCard';
import FloatingParticles from '../components/ui/FloatingParticles';

export default function NotificationsScreen({ navigation }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications(user?.uid);

  // Note: we can't instantiate useFollow for every user in a list easily,
  // so we'll use a single instance or direct functions for accept/decline.
  // Actually, we can use the accept/decline functions from useFollow with hardcoded UIDs by passing currentUserId.
  const { acceptFollowRequest, declineFollowRequest } = useFollow(user?.uid, null); 

  const handleNotificationPress = async (item) => {
    if (!item.read) {
      await markAsRead(item.id);
    }
    
    // Navigate based on type
    if (item.type === 'follow_request' || item.type === 'new_follower' || item.type === 'follow_accepted') {
      navigation.navigate('UserProfile', { userId: item.fromUserId });
    } else if (item.postId) {
      // Could navigate to single post view (not implemented yet), 
      // for now go to author's profile
      navigation.navigate('UserProfile', { userId: item.fromUserId });
    }
  };

  const handleAcceptRequest = async (item) => {
    await acceptFollowRequest(item.fromUserId);
    await markAsRead(item.id);
  };

  const handleDeclineRequest = async (item) => {
    await declineFollowRequest(item.fromUserId);
    await markAsRead(item.id);
  };

  // ═══ Format Time ═══
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);

    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // ═══ Notification Row Component ═══
  const NotificationContent = ({ item, fromUser }) => {
    const initials = fromUser?.displayName ? fromUser.displayName[0].toUpperCase() : '?';

    let icon = { name: 'notifications', color: theme.colors.copper };
    let text = 'did something.';

    switch (item.type) {
      case 'like':
        icon = { name: 'heart', color: theme.colors.crimson };
        text = 'liked your post.';
        break;
      case 'comment':
        icon = { name: 'chatbubble', color: theme.colors.parchment };
        text = 'commented on your post.';
        break;
      case 'follow_request':
        icon = { name: 'person-add', color: theme.colors.gold };
        text = 'requested to follow you.';
        break;
      case 'new_follower':
      case 'follow_accepted':
        icon = { name: 'person-add', color: theme.colors.gold };
        text = item.type === 'new_follower' ? 'started following you.' : 'accepted your follow request.';
        break;
    }

    return (
      <View style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}>
        <View style={styles.iconBadge}>
          <Ionicons name={icon.name} size={16} color={icon.color} />
        </View>
        <View style={[styles.avatar, { backgroundColor: theme.colors.copper + '44' }]}>
          {fromUser?.avatarUrl ? (
            <Image source={{ uri: fromUser.avatarUrl }} style={styles.avatarImg} />
          ) : (
            <Text style={{ color: theme.colors.copper, fontSize: 16, fontWeight: 'bold' }}>{initials}</Text>
          )}
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[theme.typography.body, { color: theme.colors.ivory }]}>
            <Text style={{ fontWeight: 'bold' }}>{fromUser?.displayName || 'Someone'} </Text>
            {text}
          </Text>
          <Text style={[theme.typography.caption, { color: theme.colors.ash, marginTop: 4 }]}>
            {formatTime(item.createdAt)}
          </Text>

          {item.type === 'follow_request' && (
            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: theme.colors.gold }]}
                onPress={() => handleAcceptRequest(item)}
              >
                <Text style={{ color: theme.colors.obsidian, fontWeight: '600', fontSize: 12 }}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: theme.colors.midnight, borderWidth: 1, borderColor: theme.colors.ash }]}
                onPress={() => handleDeclineRequest(item)}
              >
                <Text style={{ color: theme.colors.ivory, fontWeight: '600', fontSize: 12 }}>Decline</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        {!item.read && (
          <View style={[styles.unreadDot, { backgroundColor: theme.colors.gold }]} />
        )}
      </View>
    );
  };

  // ═══ Individual Notification Item ═══
  const NotificationItem = ({ item }) => {
    const [fromUser, setFromUser] = useState(null);

    useEffect(() => {
      if (item.fromUserId) {
        getDoc(doc(db, 'users', item.fromUserId)).then(snap => {
          if (snap.exists()) {
            setFromUser({ uid: snap.id, ...snap.data() });
          }
        });
      }
    }, [item.fromUserId]);

    return (
      <TouchableOpacity
        style={[
          styles.notificationRow,
          !item.read && { backgroundColor: theme.colors.midnight + '66' }
        ]}
        activeOpacity={0.7}
        onPress={() => handleNotificationPress(item)}
      >
        <NotificationContent item={item} fromUser={fromUser} />
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
            Notifications
          </Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={markAllAsRead}
            disabled={unreadCount === 0}
          >
            {unreadCount > 0 && <Ionicons name="checkmark-done" size={24} color={theme.colors.gold} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.gold} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centered}>
          <GlassCard style={styles.emptyCard} glowOnPress={false}>
            <Ionicons name="notifications-off-outline" size={48} color={theme.colors.gold} />
            <Text style={[theme.typography.headingS, { color: theme.colors.gold, marginTop: 16 }]}>
              All caught up!
            </Text>
            <Text style={[theme.typography.body, { color: theme.colors.parchment, textAlign: 'center', marginTop: 8 }]}>
              You don't have any notifications right now.
            </Text>
          </GlassCard>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NotificationItem item={item} />}
          contentContainerStyle={{ paddingBottom: 40 }}
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
  centered: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  emptyCard: {
    padding: 32, alignItems: 'center', width: '100%',
  },
  notificationRow: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    marginLeft: 16,
  },
  avatarImg: { width: 44, height: 44, borderRadius: 22 },
  iconBadge: {
    position: 'absolute',
    left: 10,
    zIndex: 1,
  },
  unreadDot: {
    width: 10, height: 10, borderRadius: 5,
    marginLeft: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
});
