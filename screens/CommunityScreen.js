// screens/CommunityScreen.js — Instagram/Facebook-style social feed
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, Image, KeyboardAvoidingView, Platform,
  Alert, ActivityIndicator, RefreshControl, Modal, Dimensions, Animated,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useAuth } from '../constants/AuthContext';
import { useTheme } from '../constants/ThemeContext';
import useNotifications from '../hooks/useNotifications';
import usePosts from '../hooks/usePosts';
import { getMyAlbums } from '../services/album.service';

import FloatingParticles from '../components/ui/FloatingParticles';
import PostCard from '../components/ui/PostCard';
import ComposerModal from '../components/ui/ComposerModal';

const { width: SCREEN_W } = Dimensions.get('window');
const tabs = ['For You', 'Trending', 'Nearby', 'Solo Travellers'];

export default function CommunityScreen({ navigation }) {
  const { theme } = useTheme();
  const { user, userProfile } = useAuth();

  const [activeTab, setActiveTab] = useState('Recent');
  const [showComposer, setShowComposer] = useState(false);
  const [albums, setAlbums] = useState([]);
  const [text, setText] = useState('');
  const [mediaItems, setMediaItems] = useState([]);
  const [postLocation, setPostLocation] = useState('');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const { unreadCount } = useNotifications(user?.uid);
  const {
    posts, loading, refreshing, hasMore,
    uploadProgress, isUploading,
    fetchPosts, loadMore, onRefresh,
    createPost, likePost, unlikePost, deletePost,
  } = usePosts();

  // FAB animation
  const fabScale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(fabScale, { toValue: 1, delay: 600, speed: 10, bounciness: 12, useNativeDriver: true }).start();
  }, []);

  // ═══ Fetch posts and albums ═══
  useEffect(() => {
    const sort = activeTab === 'Trending' ? 'popular' : 'recent';
    fetchPosts(sort);
  }, [activeTab, fetchPosts]);

  useEffect(() => {
    const loadAlbums = async () => {
      try {
        const res = await getMyAlbums(1, 100);
        setAlbums(res.data || []);
      } catch (error) {
        console.log('Failed to fetch albums for composer', error);
      }
    };
    if (user) {
      loadAlbums();
    }
  }, [user]);

  // ═══ Media Picker ═══
  const pickMedia = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 0.7,
    });
    if (!result.canceled) {
      setMediaItems(result.assets.map(asset => ({
        uri: asset.uri,
        type: asset.type || (asset.uri.endsWith('.mp4') ? 'video' : 'image'),
      })));
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
    if (!text.trim() && mediaItems.length === 0) return;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to post.');
      return;
    }

    setIsPosting(true);
    try {
      await createPost(text.trim(), mediaItems, postLocation || 'Earth');

      // Reset & close
      setText('');
      setMediaItems([]);
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
      onDelete={deletePost}
    />
  );

  // ═══ Stories-style top bar (compact) ═══
  const renderHeader = () => (
    <View style={{ paddingBottom: 4 }}>
      {/* Search Bar */}
      <TouchableOpacity 
        style={{ marginHorizontal: 16, marginTop: 12, marginBottom: 4, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.midnight, borderWidth: 1, borderColor: theme.colors.borderSilver, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 }}
        onPress={() => navigation.navigate('Discover')}
        activeOpacity={0.8}
      >
        <Ionicons name="search" size={18} color={theme.colors.ash} style={{ marginRight: 8 }} />
        <Text style={[theme.typography.body, { color: theme.colors.ash }]}>Find travel buddies or usernames...</Text>
      </TouchableOpacity>
      
      {/* Filter Belt */}
      <View>
        <FlatList 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabRow}
          data={tabs}
          keyExtractor={(item) => item}
          renderItem={({ item: t }) => {
            const isActive = activeTab === t;
            let iconName = 'star-outline';
            if (t === 'Trending') iconName = 'flame-outline';
            if (t === 'Nearby') iconName = 'location-outline';
            if (t === 'Solo Travellers') iconName = 'walk-outline';
            return (
              <TouchableOpacity
                style={[
                  styles.tabPill,
                  isActive
                    ? { backgroundColor: theme.colors.gold }
                    : { backgroundColor: theme.colors.midnight, borderWidth: 1, borderColor: theme.colors.borderSilver },
                ]}
                onPress={() => setActiveTab(t)}
              >
                <Ionicons
                  name={iconName}
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
          }}
        />
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
            <Ionicons name="notifications-outline" size={20} color={theme.colors.ivory} />
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
        {/* Search replaced by top bar search */}
        <TouchableOpacity style={styles.subTaskbarIcon}>
          <Ionicons name="play-circle-outline" size={28} color={theme.colors.ivory} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.subTaskbarIcon} onPress={() => navigation.navigate('ChatList')}>
          <Ionicons name="paper-plane-outline" size={26} color={theme.colors.ivory} />
        </TouchableOpacity>
      </View>

      {/* ═══ Composer Modal (Instagram-style) ═══ */}
        <ComposerModal
          visible={showComposer}
          onClose={() => setShowComposer(false)}
          text={text}
          setText={setText}
          mediaItems={mediaItems}
          setMediaItems={setMediaItems}
          postLocation={postLocation}
          isFetchingLocation={isFetchingLocation}
          onGetLocation={handleGetLocation}
          onPickImage={pickMedia}
          onPost={handlePost}
          isPosting={isPosting}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          userProfile={userProfile}
          displayName={displayName}
          initials={initials}
          albums={albums}
        />
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
    justifyContent: 'flex-end',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
    postButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
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
