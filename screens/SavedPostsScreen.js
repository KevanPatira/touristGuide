import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, KeyboardAvoidingView, Platform, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../constants/firebaseConfig';
import { useAuth } from '../constants/AuthContext';
import { useTheme } from '../constants/ThemeContext';
import PostCard from '../components/ui/PostCard';
import FloatingParticles from '../components/ui/FloatingParticles';
import StaggerRevealText from '../components/ui/StaggerRevealText';

export default function SavedPostsScreen({ navigation }) {
  const { theme } = useTheme();
  const { userProfile } = useAuth();
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState('recent'); // 'recent' | 'oldest'
  const [showSortModal, setShowSortModal] = useState(false);

  useEffect(() => {
    fetchSavedPosts();
  }, [userProfile?.savedPosts, sortOrder]);

  const fetchSavedPosts = async () => {
    if (!userProfile?.savedPosts || userProfile.savedPosts.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const savedIds = [...userProfile.savedPosts];
      
      // Sort the IDs based on selection
      // newly appended items to array mean they are the most recent.
      if (sortOrder === 'recent') {
        savedIds.reverse();
      }
      
      const fetchedPosts = [];
      for (const postId of savedIds) {
        const postSnap = await getDoc(doc(db, 'posts', postId));
        if (postSnap.exists()) {
          fetchedPosts.push({ id: postSnap.id, ...postSnap.data() });
        }
      }
      setPosts(fetchedPosts);
    } catch (error) {
      console.log('Error fetching saved posts:', error);
    }
    setLoading(false);
  };

  const handleAuthorPress = (authorId) => {
    if (authorId === userProfile?.uid) return;
    navigation.navigate('UserProfile', { userId: authorId });
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.colors.obsidian }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FloatingParticles count={10} />

      {/* Header */}
      <View style={[styles.headerArea, { backgroundColor: theme.colors.midnight }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.gold} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <StaggerRevealText text="Saved Posts" style={[theme.typography.displayS, { color: theme.colors.gold }]} />
            <Text style={[theme.typography.caption, { color: theme.colors.parchment, marginTop: 4 }]}>
              Your personalized collection
            </Text>
          </View>
        </View>

        {/* Sort Controls */}
        <TouchableOpacity 
          style={styles.sortByButton}
          onPress={() => setShowSortModal(true)}
        >
          <Ionicons name="swap-vertical" size={16} color={theme.colors.gold} />
          <Text style={[theme.typography.label, { color: theme.colors.ivory, marginLeft: 6 }]}>
            {sortOrder === 'recent' ? 'Sort by: Recently Saved' : 'Sort by: Oldest Saved'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.gold} />
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="bookmarks-outline" size={64} color={theme.colors.ash} />
          <Text style={[theme.typography.headingM, { color: theme.colors.parchment, marginTop: 16 }]}>
            No saved posts
          </Text>
          <Text style={[theme.typography.body, { color: theme.colors.ash, textAlign: 'center', marginTop: 8 }]}>
            When you see something you like, tap the bookmark icon to save it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard post={item} onAuthorPress={handleAuthorPress} />
          )}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Sort Modal */}
      <Modal visible={showSortModal} animationType="fade" transparent>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.colors.midnight }]}>
            <View style={[styles.modalHandle, { backgroundColor: theme.colors.borderSilver }]} />
            <Text style={[theme.typography.headingM, { color: theme.colors.ivory, marginBottom: 16 }]}>
              Sort by
            </Text>
            
            <TouchableOpacity
              style={styles.sortOptionRow}
              onPress={() => { setSortOrder('recent'); setShowSortModal(false); }}
            >
              <Text style={[theme.typography.body, { color: sortOrder === 'recent' ? theme.colors.gold : theme.colors.ivory }]}>
                Recently Saved
              </Text>
              {sortOrder === 'recent' && <Ionicons name="checkmark" size={24} color={theme.colors.gold} />}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.sortOptionRow}
              onPress={() => { setSortOrder('oldest'); setShowSortModal(false); }}
            >
              <Text style={[theme.typography.body, { color: sortOrder === 'oldest' ? theme.colors.gold : theme.colors.ivory }]}>
                Oldest Saved
              </Text>
              {sortOrder === 'oldest' && <Ionicons name="checkmark" size={24} color={theme.colors.gold} />}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
    marginLeft: -8,
  },
  sortByButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'flex-start',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sortOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
});
