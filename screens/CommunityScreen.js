// screens/CommunityScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Share,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const tabs = ['Popular', 'Recent', 'Nearby'];
const STORAGE_KEY = '@community_posts';

const initialPosts = [
  {
    id: '1',
    name: 'Amara K.',
    time: '2h ago',
    location: 'Santorini, Greece',
    text: 'The sunset views from Oia are absolutely breathtaking! Arrive 2 hours early to grab a good spot.',
    imageUri: null,
    likes: 142,
    comments: 28,
  },
  {
    id: '2',
    name: 'Lucas M.',
    time: '5h ago',
    location: 'Kyoto, Japan',
    text: 'Visit Fushimi Inari early morning to avoid the crowd. Try the street food near the entrance.',
    imageUri: null,
    likes: 96,
    comments: 19,
  },
];

function PostCard({ post }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes);

  const toggleLike = () => {
    if (liked) {
      setLikesCount(prev => prev - 1);
    } else {
      setLikesCount(prev => prev + 1);
    }
    setLiked(!liked);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this travel tip from ${post.name}: "${post.text}" - via TouristGuide App`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  return (
    <View style={styles.postCard}>
      {/* header */}
      <View style={styles.postHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitials}>{post.name[0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.postName}>{post.name}</Text>
          <Text style={styles.postMeta}>
            {post.time} • {post.location}
          </Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={20} color="#888" />
        </TouchableOpacity>
      </View>

      {/* body */}
      <View style={styles.postBody}>
        {post.text ? <Text style={styles.postText}>{post.text}</Text> : null}
        
        {/* Render Image if exists */}
        {post.imageUri && (
          <Image 
            source={{ uri: post.imageUri }} 
            style={styles.postImage} 
            resizeMode="cover"
          />
        )}
      </View>

      {/* actions */}
      <View style={styles.postActions}>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <TouchableOpacity style={styles.statChip} onPress={toggleLike}>
            <Ionicons name={liked ? "heart" : "heart-outline"} size={20} color={liked ? "#e91e63" : "#888"} />
            <Text style={[styles.statText, liked && { color: "#e91e63" }]}>{likesCount}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.statChip}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#888" />
            <Text style={styles.statText}>{post.comments}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', gap: 16 }}>
          <TouchableOpacity onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color="#888" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSaved(!saved)}>
            <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={20} color={saved ? "#ff7a45" : "#888"} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function CommunityScreen() {
  const [activeTab, setActiveTab] = useState('Popular');
  const [text, setText] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [posts, setPosts] = useState(initialPosts);
  const [postLocation, setPostLocation] = useState('My Location');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  // Load from local storage to simulate backend persistence
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPosts(JSON.parse(stored));
      }
    } catch(e) {}
  };

  const savePosts = async (newPosts) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPosts));
    } catch(e) {}
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

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

  const handlePost = () => {
    if (!text.trim() && !imageUri) return;
    
    const newPost = {
      id: Date.now().toString(),
      name: 'You',
      time: 'Just now',
      location: postLocation,
      text: text,
      imageUri: imageUri,
      likes: 0,
      comments: 0,
    };
    
    const updated = [newPost, ...posts];
    setPosts(updated);
    savePosts(updated);
    
    // Reset inputs
    setText('');
    setImageUri(null);
    setPostLocation('My Location');
  };

  const renderPost = ({ item }) => <PostCard post={item} />;

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* header */}
      <View style={styles.headerArea}>
        <Text style={styles.title}>Community</Text>
        <Text style={styles.subtitle}>Share tips with fellow travelers</Text>

        {/* Input box */}
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <View style={styles.smallAvatar}><Text style={{color: '#fff', fontSize: 12}}>Y</Text></View>
            <TextInput
              placeholder="Share a travel tip or photo..."
              placeholderTextColor="#777"
              style={styles.input}
              value={text}
              onChangeText={setText}
              multiline
            />
          </View>
          
          {imageUri && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImageUri(null)}>
                <Ionicons name="close-circle" size={24} color="#ff4444" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputToolbar}>
            <TouchableOpacity style={styles.iconButton} onPress={pickImage}>
              <Ionicons name="image-outline" size={22} color="#ff7a45" />
            </TouchableOpacity>
            
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity style={styles.iconButton} onPress={handleGetLocation}>
                <Ionicons name="location-outline" size={22} color={postLocation !== 'My Location' ? "#4CAF50" : "#ff7a45"} />
              </TouchableOpacity>
              {isFetchingLocation ? (
                <ActivityIndicator size="small" color="#ff7a45" />
              ) : postLocation !== 'My Location' ? (
                <Text style={{ color: '#4CAF50', fontSize: 11, marginRight: 8, maxWidth: 100 }} numberOfLines={1}>
                  {postLocation}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity 
              style={[styles.postButton, (!text.trim() && !imageUri) && { opacity: 0.5 }]} 
              onPress={handlePost}
              disabled={!text.trim() && !imageUri}
            >
              <Text style={styles.postButtonText}>Post</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* tabs */}
        <View style={styles.tabRow}>
          {tabs.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabChip, activeTab === t && styles.tabChipActive]}
              onPress={() => setActiveTab(t)}
            >
              <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* feed */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050b18' },

  headerArea: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#131b33',
  },
  title: { color: '#ffffff', fontSize: 24, fontWeight: '700' },
  subtitle: { color: '#b0b4c3', fontSize: 13, marginTop: 4 },

  inputContainer: {
    backgroundColor: '#1f2740',
    borderRadius: 18,
    marginTop: 16,
    padding: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
  },
  smallAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#ffb38a',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 10,
  },
  input: { 
    flex: 1, color: '#ffffff', fontSize: 14,
    maxHeight: 100, alignSelf: 'flex-start'
  },
  inputToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2b3350',
    paddingTop: 12,
  },
  iconButton: {
    marginRight: 16,
  },
  postButton: {
    backgroundColor: '#ff7a45',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 'auto',
  },
  postButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 13 },
  
  imagePreviewContainer: {
    marginTop: 10,
    position: 'relative',
    alignSelf: 'flex-start',
  },
  imagePreview: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },

  tabRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  tabChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
    backgroundColor: '#1a2038',
    borderWidth: 1,
    borderColor: '#2b3350',
  },
  tabChipActive: {
    backgroundColor: '#ff7a4522',
    borderColor: '#ff7a45',
  },
  tabText: { color: '#888', fontSize: 13 },
  tabTextActive: { color: '#ff7a45', fontWeight: '600' },

  postCard: {
    backgroundColor: '#161b2b',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e2540',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffb38a',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#d45a1b',
    fontWeight: '700',
    fontSize: 16,
  },
  postName: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  postMeta: { color: '#b0b4c3', fontSize: 12, marginTop: 2 },

  postBody: { marginTop: 14 },
  postText: { color: '#e1e3f0', fontSize: 14, lineHeight: 20 },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 12,
    backgroundColor: '#111728',
  },

  postActions: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#252a3f',
    paddingTop: 12,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: '#888',
    fontSize: 13,
    marginLeft: 6,
    fontWeight: '500',
  },
});
