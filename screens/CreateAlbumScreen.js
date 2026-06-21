// screens/CreateAlbumScreen.js — Create a new trip album and select media
import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, StyleSheet, TouchableOpacity, 
  Image, FlatList, ActivityIndicator, Alert, Modal, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import { createAlbum } from '../services/album.service';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function CreateAlbumScreen() {
  const [albumName, setAlbumName] = useState('');
  const [mediaItems, setMediaItems] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Media Viewer State
  const [viewerVisible, setViewerVisible] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const navigation = useNavigation();

  const player = useVideoPlayer(null, (player) => {
    player.loop = true;
  });

  useEffect(() => {
    const activeMedia = mediaItems[activeMediaIndex];
    if (viewerVisible && activeMedia && activeMedia.type === 'video') {
      player.replaceAsync({ uri: activeMedia.uri }).then(() => {
        player.play();
      });
    } else {
      player.pause();
    }
  }, [viewerVisible, activeMediaIndex, mediaItems, player]);

  // 1. Pick media
  const pickMedia = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: true,
        selectionLimit: 20, // max 20 per batch for sanity
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newItems = result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.type === 'video' ? 'video' : 'image',
          width: asset.width,
          height: asset.height,
        }));
        
        setMediaItems(prev => [...prev, ...newItems]);
      }
    } catch (error) {
      console.log('Error picking media:', error);
      Alert.alert('Error', 'Failed to pick media');
    }
  };

  // 2. Remove selected media
  const removeMedia = (index) => {
    setMediaItems(prev => prev.filter((_, i) => i !== index));
  };

  // 3. Create album
  const handleCreateAlbum = async () => {
    if (!albumName.trim()) {
      Alert.alert('Missing Name', 'Please give your trip album a name!');
      return;
    }
    if (mediaItems.length === 0) {
      Alert.alert('Missing Photos', 'Please add at least one photo or video to your album!');
      return;
    }

    try {
      setIsUploading(true);
      await createAlbum(albumName, mediaItems, (progress) => {
        setUploadProgress(progress);
      });
      
      Alert.alert('Success!', 'Your trip album has been created.');
      navigation.goBack();
    } catch (error) {
      console.log('Create album error:', error);
      Alert.alert('Error', 'Failed to create album. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Open full-screen viewer
  const openViewer = (index) => {
    setActiveMediaIndex(index);
    setViewerVisible(true);
  };

  const renderMediaItem = ({ item, index }) => (
    <View style={styles.mediaContainer}>
      <TouchableOpacity onPress={() => openViewer(index)} activeOpacity={0.8}>
        <Image source={{ uri: item.uri }} style={styles.mediaThumbnail} />
        {item.type === 'video' && (
          <View style={styles.videoOverlay}>
            <Ionicons name="play-circle" size={32} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.removeBtn} onPress={() => removeMedia(index)}>
        <Ionicons name="close-circle" size={24} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New Trip Album</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Album Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Summer in Paris 2026"
          placeholderTextColor="#666"
          value={albumName}
          onChangeText={setAlbumName}
          maxLength={100}
        />

        <View style={styles.mediaHeader}>
          <Text style={styles.label}>Photos & Videos ({mediaItems.length})</Text>
          <TouchableOpacity onPress={pickMedia} style={styles.addMediaBtn}>
            <Ionicons name="add" size={20} color="#4DA8DA" />
            <Text style={styles.addMediaText}>Add Media</Text>
          </TouchableOpacity>
        </View>

        {mediaItems.length === 0 ? (
          <TouchableOpacity style={styles.emptyState} onPress={pickMedia}>
            <Ionicons name="images-outline" size={48} color="#666" />
            <Text style={styles.emptyStateText}>Tap to add photos and videos</Text>
          </TouchableOpacity>
        ) : (
          <FlatList
            data={mediaItems}
            keyExtractor={(_, index) => index.toString()}
            numColumns={3}
            renderItem={renderMediaItem}
            contentContainerStyle={styles.mediaGrid}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Footer / Create Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.createBtn, (isUploading || mediaItems.length === 0 || !albumName) && styles.createBtnDisabled]}
          onPress={handleCreateAlbum}
          disabled={isUploading || mediaItems.length === 0 || !albumName}
        >
          {isUploading ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.createBtnText}>
                Uploading {uploadProgress}%...
              </Text>
            </View>
          ) : (
            <Text style={styles.createBtnText}>Create Album</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Media Viewer Modal */}
      <Modal visible={viewerVisible} transparent={true} animationType="fade">
        <View style={styles.viewerContainer}>
          <TouchableOpacity style={styles.viewerClose} onPress={() => setViewerVisible(false)}>
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>

          {mediaItems[activeMediaIndex] && (
            <View style={styles.viewerContent}>
              {mediaItems[activeMediaIndex].type === 'video' ? (
                <VideoView
                  player={player}
                  style={styles.viewerMedia}
                  nativeControls={true}
                  contentFit="contain"
                />
              ) : (
                <Image 
                  source={{ uri: mediaItems[activeMediaIndex].uri }} 
                  style={styles.viewerMedia} 
                  resizeMode="contain" 
                />
              )}
            </View>
          )}
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  backBtn: {
    padding: 5,
  },
  form: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E0E0E0',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    color: '#fff',
    padding: 15,
    fontSize: 16,
    marginBottom: 25,
  },
  mediaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addMediaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(77, 168, 218, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addMediaText: {
    color: '#4DA8DA',
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    height: 200,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#333',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#666',
    marginTop: 10,
    fontSize: 16,
  },
  mediaGrid: {
    paddingBottom: 20,
  },
  mediaContainer: {
    width: (width - 40 - 20) / 3, // padding 20 on sides, gap 10 between items
    height: (width - 40 - 20) / 3,
    marginRight: 10,
    marginBottom: 10,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  mediaThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2A2A2A',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    backgroundColor: '#121212',
  },
  createBtn: {
    backgroundColor: '#4DA8DA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  createBtnDisabled: {
    opacity: 0.5,
  },
  createBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerClose: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  viewerContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  viewerMedia: {
    width: '100%',
    height: '80%',
  }
});
