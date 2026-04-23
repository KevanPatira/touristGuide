// screens/CommunityScreen.js — Instagram/Facebook-style social feed
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, Image, KeyboardAvoidingView, Platform,
  Alert, ActivityIndicator, RefreshControl, Modal, Dimensions, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useAuth } from '../constants/AuthContext';
import { useTheme } from '../constants/ThemeContext';
import useNotifications from '../hooks/useNotifications';
import usePosts from '../hooks/usePosts';

import FloatingParticles from '../components/ui/FloatingParticles';
import PostCard from '../components/ui/PostCard';

const { width: SCREEN_W } = Dimensions.get('window');
const tabs = ['Recent', 'Popular'];

export default function CommunityScreen({ navigation }) {
  const { theme } = useTheme();
  const { user, userProfile } = useAuth();

  const [activeTab, setActiveTab] = useState('Recent');
  const [showComposer, setShowComposer] = useState(false);
  const [text, setText] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [postLocation, setPostLocation] = useState('');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const { unreadCount } = useNotifications(user?.uid);
  const {
    posts, loading, refreshing, hasMore,
    fetchPosts, loadMore, onRefresh,
    createPost, likePost, unlikePost,
  } = usePosts();

  // FAB animation
  const fabScale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(fabScale, { toValue: 1, delay: 600, speed: 10, bounciness: 12, useNativeDriver: true }).start();
  }, []);

  // ═══ Fetch posts when tab changes ═══
  useEffect(() => {
    const sort = activeTab === 'Popular' ? 'popular' : 'recent';
    fetchPosts(sort);
  }, [activeTab, fetchPosts]);

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

  // ═══ Create Post (MongoDB) ═══
  const handlePost = async () => {
    if (!text.trim() && !imageUri) return;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to post.');
      return;
    }

    setIsPosting(true);
    try {
      const imageUrl = imageUri || null;
      await createPost(text.trim(), imageUrl, postLocation || 'Earth');

      // Reset & close
      setText('');
      setImageUri(null);
      setPostLocation('');
      setShowComposer(false);
    } catch (e) {
      Alert.alert('Error', 'Could not create post. Please try again.');
      console.log('Post error:', e);
    }
    setIsPosting(false);
  };

  // ═══ Navigate to user profile ═══
  const handleAuthorPress = (authorId) => {
    if (!authorId || authorId === user?.uid) return;
    navigation.navigate('UserProfile', { userId: authorId });
  };

  const displayName = userProfile?.displayName || userProfile?.name || user?.displayName || 'You';
  const initials = displayName[0]?.toUpperCase() || '?';

  const renderPost = ({ item }) => (
    <PostCard
      post={item}
      onAuthorPress={handleAuthorPress}
      onLike={likePost}
      onUnlike={unlikePost}
    />
  );

  // ═══ Stories-style top bar (compact) ═══
  const renderHeader = () => (
    <View style={{ paddingBottom: 4 }}>
      {/* Instagram-style tab pills */}
      <View style={styles.tabRow}>
        {tabs.map((t) => {
          const isActive = activeTab === t;
          return (
            <TouchableOpacity
              key={t}
              style={[
                styles.tabPill,
                isActive
                  ? { backgroundColor: theme.colors.gold }
                  : { backgroundColor: theme.colors.midnight, borderWidth: 1, borderColor: theme.colors.borderSilver },
              ]}
              onPress={() => setActiveTab(t)}
            >
              <Ionicons
                name={t === 'Recent' ? 'time-outline' : 'flame-outline'}
                size={14}
                color={isActive ? theme.colors.obsidian : theme.colors.gold}
                style={{ marginRight: 4 }}
              />
              <Text style={[theme.typography.label, {
                color: isActive ? theme.colors.obsidian : theme.colors.gold,
                fontSize: 12,
              }]}>
                {t}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.obsidian }]}>
      <FloatingParticles count={6} />

      {/* ═══ Instagram-style Top Bar ═══ */}
      <View style={[styles.topBar, { backgroundColor: theme.colors.midnight }]}>
        <TouchableOpacity
          style={styles.topLeftIcon}
          onPress={() => setShowComposer(true)}
        >
          <Ionicons name="add" size={28} color={theme.colors.ivory} />
        </TouchableOpacity>

        <Text style={[theme.typography.headingM, { color: theme.colors.gold, fontFamily: 'PlayfairDisplay_700Bold', flex: 1, textAlign: 'center' }]}>
          Community
        </Text>

        <View style={styles.topRightIcons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={26} color={theme.colors.ivory} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ═══ Feed ═══ */}
      {loading && posts.length === 0 ? (
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
          <TouchableOpacity
            style={[styles.emptyPostBtn, { borderColor: theme.colors.gold }]}
            onPress={() => setShowComposer(true)}
          >
            <Ionicons name="add" size={18} color={theme.colors.gold} />
            <Text style={[theme.typography.label, { color: theme.colors.gold, marginLeft: 6 }]}>Create Post</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item._id || item.id}
          renderItem={renderPost}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={{ paddingHorizontal: 0, paddingBottom: 180 }}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
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

      {/* ═══ Sub Taskbar ═══ */}
      <View style={[styles.subTaskbar, { backgroundColor: theme.colors.midnight, borderTopColor: theme.colors.borderSilver }]}>
        <TouchableOpacity style={styles.subTaskbarIcon}>
          <Ionicons name="home" size={26} color={theme.colors.ivory} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.subTaskbarIcon} onPress={() => navigation.navigate('Discover')}>
          <Ionicons name="search" size={26} color={theme.colors.ivory} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.subTaskbarIcon}>
          <Ionicons name="play-circle-outline" size={28} color={theme.colors.ivory} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.subTaskbarIcon} onPress={() => navigation.navigate('ChatList')}>
          <Ionicons name="paper-plane-outline" size={26} color={theme.colors.ivory} />
        </TouchableOpacity>
      </View>

      {/* ═══ Composer Modal (Instagram-style) ═══ */}
      <Modal visible={showComposer} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.composerOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setShowComposer(false)}
          />
          <View style={[styles.composerSheet, { backgroundColor: theme.colors.midnight }]}>
            {/* Handle bar */}
            <View style={[styles.sheetHandle, { backgroundColor: theme.colors.borderSilver }]} />

            {/* Header */}
            <View style={styles.composerHeader}>
              <TouchableOpacity onPress={() => setShowComposer(false)}>
                <Text style={[theme.typography.body, { color: theme.colors.parchment }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[theme.typography.headingS, { color: theme.colors.ivory }]}>New Post</Text>
              <TouchableOpacity
                onPress={handlePost}
                disabled={(!text.trim() && !imageUri) || isPosting}
              >
                <View style={[
                  styles.postButton,
                  { backgroundColor: (text.trim() || imageUri) && !isPosting ? theme.colors.gold : theme.colors.ash + '44' }
                ]}>
                  {isPosting ? (
                    <ActivityIndicator size="small" color={theme.colors.obsidian} />
                  ) : (
                    <Text style={[theme.typography.label, {
                      color: (text.trim() || imageUri) ? theme.colors.obsidian : theme.colors.ash,
                      fontSize: 13,
                    }]}>Post</Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            {/* Author row */}
            <View style={styles.authorRow}>
              <View style={[styles.composerAvatar, { backgroundColor: theme.colors.copper + '44' }]}>
                {userProfile?.avatarUrl ? (
                  <Image source={{ uri: userProfile.avatarUrl }} style={styles.composerAvatarImg} />
                ) : (
                  <Text style={{ color: theme.colors.copper, fontSize: 16, fontWeight: 'bold' }}>
                    {initials}
                  </Text>
                )}
              </View>
              <View>
                <Text style={[theme.typography.body, { color: theme.colors.ivory, fontWeight: '600' }]}>
                  {displayName}
                </Text>
                {postLocation ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                    <Ionicons name="location" size={12} color={theme.colors.emerald} />
                    <Text style={[theme.typography.caption, { color: theme.colors.emerald, marginLeft: 4, fontSize: 11 }]}>
                      {postLocation}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Text input */}
            <TextInput
              placeholder="What's on your mind? Share a travel tip..."
              placeholderTextColor={theme.colors.ash}
              style={[theme.typography.body, styles.composerInput, { color: theme.colors.ivory }]}
              value={text}
              onChangeText={setText}
              multiline
              autoFocus
            />

            {/* Image preview */}
            {imageUri && (
              <View style={styles.composerImageWrap}>
                <Image source={{ uri: imageUri }} style={styles.composerImage} />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => setImageUri(null)}
                >
                  <Ionicons name="close-circle" size={28} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {/* Toolbar */}
            <View style={[styles.composerToolbar, { borderTopColor: theme.colors.borderSilver }]}>
              <TouchableOpacity style={styles.toolbarBtn} onPress={pickImage}>
                <Ionicons name="image-outline" size={24} color={theme.colors.gold} />
                <Text style={[theme.typography.caption, { color: theme.colors.parchment, marginLeft: 6, fontSize: 11 }]}>Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.toolbarBtn} onPress={handleGetLocation}>
                {isFetchingLocation ? (
                  <ActivityIndicator size="small" color={theme.colors.gold} />
                ) : (
                  <>
                    <Ionicons
                      name="location-outline"
                      size={24}
                      color={postLocation ? theme.colors.emerald : theme.colors.gold}
                    />
                    <Text style={[theme.typography.caption, {
                      color: postLocation ? theme.colors.emerald : theme.colors.parchment,
                      marginLeft: 6, fontSize: 11,
                    }]}>
                      {postLocation || 'Location'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Instagram-style top bar ──
  topBar: {
    paddingTop: 54,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  topLeftIcon: {
    padding: 4,
    width: 40,
  },
  topRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 40,
    justifyContent: 'flex-end',
  },
  iconButton: {
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: -4, right: -4,
    backgroundColor: '#FF3B30',
    minWidth: 18, height: 18, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },

  // ── Tab pills ──
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  
  // ── Sub Taskbar ──
  subTaskbar: {
    position: 'absolute',
    bottom: 104, // Just above the global taskbar (which is at bottom: 28 + height: 68 = 96)
    left: 16,
    right: 16,
    height: 56,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,
    // Glass shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  subTaskbarIcon: {
    padding: 8,
  },

  // ── Composer Modal (bottom sheet) ──
  composerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  composerSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '80%',
  },
  sheetHandle: {
    width: 40, height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  composerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  postButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  composerAvatar: {
    width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  composerAvatarImg: { width: 42, height: 42, borderRadius: 21 },
  composerInput: {
    minHeight: 80,
    maxHeight: 160,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  composerImageWrap: {
    position: 'relative',
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  composerImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
  },
  composerToolbar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 14,
    gap: 24,
  },
  toolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // ── Empty / Loading ──
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
  emptyPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
});
