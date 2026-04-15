// screens/CommunityScreen.js — Global real-time social feed
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, Image, Share, KeyboardAvoidingView, Platform,
  Alert, ActivityIndicator, RefreshControl, Modal, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import {
  collection, query, orderBy, limit, onSnapshot,
  addDoc, doc, updateDoc, arrayUnion, arrayRemove,
  serverTimestamp, startAfter, getDocs, deleteDoc, setDoc,
  increment as firestoreIncrement,
} from 'firebase/firestore';
import { db } from '../constants/firebaseConfig';
import { useAuth } from '../constants/AuthContext';
import { useTheme } from '../constants/ThemeContext';
import useNotifications from '../hooks/useNotifications';

import GlassCard from '../components/ui/GlassCard';
import PressableGoldButton from '../components/ui/PressableGoldButton';
import StaggerRevealText from '../components/ui/StaggerRevealText';
import FloatingParticles from '../components/ui/FloatingParticles';

const POSTS_PER_PAGE = 15;

import PostCard from '../components/ui/PostCard';

// ═══════════════════════════════════════
// Main Community Screen
// ═══════════════════════════════════════
const tabs = ['Recent', 'Popular', 'Following'];

export default function CommunityScreen({ navigation }) {
  const { theme } = useTheme();
  const { user, userProfile } = useAuth();

  const [activeTab, setActiveTab] = useState('Recent');
  const [text, setText] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postLocation, setPostLocation] = useState('My Location');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const { unreadCount } = useNotifications(user?.uid);

  // ═══ Real-time feed subscription ═══
  useEffect(() => {
    let q;
    const postsRef = collection(db, 'posts');

    if (activeTab === 'Popular') {
      q = query(postsRef, orderBy('likes', 'desc'), limit(POSTS_PER_PAGE));
    } else {
      q = query(postsRef, orderBy('createdAt', 'desc'), limit(POSTS_PER_PAGE));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setPosts(data);
      setInitialLoading(false);
      setRefreshing(false);
    }, (error) => {
      console.log('Feed error:', error);
      setInitialLoading(false);
      setRefreshing(false);
    });

    return unsubscribe;
  }, [activeTab]);

  // ═══ Image Picker ═══
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // ═══ Location ═══
  const handleGetLocation = async () => {
    setIsFetchingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Could not access location.');
        setIsFetchingLocation(false);
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      let geocode = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      });
      if (geocode && geocode.length > 0) {
        setPostLocation(`${geocode[0].city || geocode[0].region}, ${geocode[0].countryCode || geocode[0].country}`);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to get location');
    }
    setIsFetchingLocation(false);
  };

  // ═══ Image upload disabled (Storage requires Blaze plan) ═══
  const uploadImage = async (uri) => {
    // Return the local URI as-is since Firebase Storage is not available
    return uri;
  };

  // ═══ Create Post ═══
  const handlePost = async () => {
    if (!text.trim() && !imageUri) return;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to post.');
      return;
    }

    setIsPosting(true);
    try {
      let imageUrl = null;
      if (imageUri) {
        imageUrl = await uploadImage(imageUri);
      }

      const postDocRef = await addDoc(collection(db, 'posts'), {
        authorId: user.uid,
        authorName: userProfile?.displayName || user.displayName || 'Traveler',
        authorAvatar: userProfile?.avatarUrl || '',
        text: text.trim(),
        imageUrl,
        location: postLocation,
        likes: 0,
        likesBy: [],
        commentsCount: 0,
        createdAt: serverTimestamp(),
      });

      // Increment user's post count
      await updateDoc(doc(db, 'users', user.uid), {
        postCount: firestoreIncrement(1),
      });

      // Notify all followers about new post
      try {
        const followersQuery = query(collection(db, 'follows'), where('followingId', '==', user.uid), where('status', '==', 'accepted'));
        const followersSnap = await getDocs(followersQuery);
        followersSnap.forEach(async (docSnap) => {
          const followerId = docSnap.data().followerId;
          await setDoc(doc(db, 'notifications', `post_${postDocRef.id}_${followerId}`), {
            recipientId: followerId,
            type: 'new_post',
            fromUserId: user.uid,
            postId: postDocRef.id,
            read: false,
            createdAt: serverTimestamp(),
          });
        });
      } catch (e) {
        console.log('Follower notification error:', e);
      }

      // Reset
      setText('');
      setImageUri(null);
      setPostLocation('My Location');
    } catch (e) {
      Alert.alert('Error', 'Could not create post. Please try again.');
      console.log('Post error:', e);
    }
    setIsPosting(false);
  };

  // ═══ Navigate to user profile ═══
  const handleAuthorPress = (authorId) => {
    if (authorId === user?.uid) return; // Don't navigate to own profile
    navigation.navigate('UserProfile', { userId: authorId });
  };

  // ═══ Refresh ═══
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // The onSnapshot will handle the refresh
  }, []);

  const displayName = userProfile?.displayName || user?.displayName || 'You';
  const initials = displayName[0]?.toUpperCase() || '?';

  const renderPost = ({ item }) => (
    <PostCard post={item} onAuthorPress={handleAuthorPress} />
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.obsidian }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FloatingParticles count={10} />

      {/* Header */}
      <View style={[styles.headerArea, { backgroundColor: theme.colors.midnight }]}>
        <View style={styles.headerRow}>
          <View>
            <StaggerRevealText text="Community" style={[theme.typography.displayS, { color: theme.colors.gold }]} />
            <Text style={[theme.typography.caption, { color: theme.colors.parchment, marginTop: 4 }]}>
              Share tips with travelers worldwide
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[styles.chatIconBtn, { backgroundColor: theme.colors.obsidian }]}
              onPress={() => navigation.navigate('Discover')}
            >
              <Ionicons name="search" size={20} color={theme.colors.gold} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chatIconBtn, { backgroundColor: theme.colors.obsidian }]}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications-outline" size={22} color={theme.colors.gold} />
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chatIconBtn, { backgroundColor: theme.colors.obsidian }]}
              onPress={() => navigation.navigate('ChatList')}
            >
              <Ionicons name="chatbubbles-outline" size={22} color={theme.colors.gold} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Input box */}
        <GlassCard style={styles.inputContainer} glowOnPress={false}>
          <View style={styles.inputRow}>
            <View style={[styles.smallAvatar, { backgroundColor: theme.colors.copper + '44' }]}>
              {userProfile?.avatarUrl ? (
                <Image source={{ uri: userProfile.avatarUrl }} style={styles.smallAvatarImg} />
              ) : (
                <Text style={{ color: theme.colors.copper, fontSize: 14, fontWeight: 'bold' }}>
                  {initials}
                </Text>
              )}
            </View>
            <TextInput
              placeholder="Share a travel tip or photo..."
              placeholderTextColor={theme.colors.parchment}
              style={[theme.typography.body, styles.input, { color: theme.colors.ivory }]}
              value={text}
              onChangeText={setText}
              multiline
            />
          </View>

          {imageUri && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImageUri(null)}>
                <Ionicons name="close-circle" size={24} color={theme.colors.crimson} />
              </TouchableOpacity>
            </View>
          )}

          <View style={[styles.inputToolbar, { borderTopColor: theme.colors.borderSilver }]}>
            <TouchableOpacity style={styles.iconButton} onPress={pickImage}>
              <Ionicons name="image-outline" size={22} color={theme.colors.gold} />
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity style={styles.iconButton} onPress={handleGetLocation}>
                <Ionicons
                  name="location-outline"
                  size={22}
                  color={postLocation !== 'My Location' ? theme.colors.emerald : theme.colors.gold}
                />
              </TouchableOpacity>
              {isFetchingLocation ? (
                <ActivityIndicator size="small" color={theme.colors.gold} />
              ) : postLocation !== 'My Location' ? (
                <Text
                  style={[theme.typography.caption, { color: theme.colors.emerald, marginRight: 8, maxWidth: 100 }]}
                  numberOfLines={1}
                >
                  {postLocation}
                </Text>
              ) : null}
            </View>

            <PressableGoldButton
              label={isPosting ? '...' : 'Post'}
              onPress={handlePost}
              disabled={(!text.trim() && !imageUri) || isPosting}
              loading={isPosting}
              style={{ marginLeft: 'auto', paddingVertical: 8, paddingHorizontal: 16, minHeight: 0 }}
            />
          </View>
        </GlassCard>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {tabs.map((t) => {
            const isActive = activeTab === t;
            return (
              <TouchableOpacity
                key={t}
                style={[
                  styles.tabChip,
                  { borderColor: theme.colors.goldMuted },
                  isActive && { backgroundColor: theme.colors.gold }
                ]}
                onPress={() => setActiveTab(t)}
              >
                <Text style={[theme.typography.label, { color: isActive ? theme.colors.obsidian : theme.colors.gold }]}>
                  {t}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Feed */}
      {initialLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.gold} />
          <Text style={[theme.typography.caption, { color: theme.colors.parchment, marginTop: 12 }]}>
            Loading feed...
          </Text>
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="globe-outline" size={64} color={theme.colors.ash} />
          <Text style={[theme.typography.headingS, { color: theme.colors.parchment, marginTop: 16 }]}>
            No posts yet
          </Text>
          <Text style={[theme.typography.body, { color: theme.colors.ash, textAlign: 'center', marginTop: 6 }]}>
            Be the first to share a travel experience!
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.gold}
              colors={[theme.colors.gold]}
            />
          }
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerArea: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 10,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  chatIconBtn: {
    width: 38, height: 38,
    borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  },
  unreadBadge: {
    position: 'absolute',
    top: -4, right: -4,
    backgroundColor: '#FF3B30',
    minWidth: 18, height: 18, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    color: '#FFF', fontSize: 10, fontWeight: 'bold'
  },
  inputContainer: {
    marginTop: 20,
    padding: 16,
    borderRadius: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
  },
  smallAvatar: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12, overflow: 'hidden',
  },
  smallAvatarImg: { width: 32, height: 32, borderRadius: 16 },
  input: { flex: 1, maxHeight: 100, alignSelf: 'flex-start' },
  inputToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    borderTopWidth: 1,
    paddingTop: 16,
  },
  iconButton: { marginRight: 16 },
  imagePreviewContainer: {
    marginTop: 12,
    position: 'relative',
    alignSelf: 'flex-start',
  },
  imagePreview: { width: 200, height: 150, borderRadius: 12 },
  removeImageBtn: {
    position: 'absolute',
    top: -8, right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  tabRow: { flexDirection: 'row', marginTop: 20 },
  tabChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  postCard: { padding: 16, marginBottom: 16 },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    marginRight: 12,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 40, height: 40, borderRadius: 20 },
  postBody: { marginBottom: 16 },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 12,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  statChip: { flexDirection: 'row', alignItems: 'center' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  // Comment Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '65%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  emptyComments: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  commentItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
  },
  commentAvatar: {
    width: 30, height: 30, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  commentAvatarImg: { width: 30, height: 30, borderRadius: 15 },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  commentInput: { flex: 1, marginRight: 10 },
});
