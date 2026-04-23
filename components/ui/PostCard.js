// components/ui/PostCard.js — MongoDB-backed PostCard with comments
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Share, Animated, Modal, TextInput, FlatList, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../constants/AuthContext';
import { useTheme } from '../../constants/ThemeContext';
import * as commentService from '../../services/comment.service';
import * as postService from '../../services/post.service';
import GlassCard from './GlassCard';

function CommentsModal({ visible, onClose, postId, postAuthorId, theme }) {
  const { user, userProfile } = useAuth();
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch comments from MongoDB
  useEffect(() => {
    if (!visible || !postId) return;
    let mounted = true;

    const fetchComments = async () => {
      try {
        const res = await commentService.getComments(postId, 1, 50);
        if (mounted) {
          setComments(res.data || []);
          setLoading(false);
        }
      } catch (e) {
        console.log('Fetch comments error:', e.message);
        if (mounted) setLoading(false);
      }
    };

    setLoading(true);
    fetchComments();
    return () => { mounted = false; };
  }, [visible, postId]);

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      const res = await commentService.addComment(postId, commentText.trim());
      setComments(prev => [...prev, res.data]);
      setCommentText('');
    } catch (e) {
      Alert.alert('Error', 'Could not add comment.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.midnight }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.borderSilver }]}>
            <Text style={[theme.typography.headingS, { color: theme.colors.ivory }]}>Comments</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.parchment} />
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          {loading ? (
            <ActivityIndicator color={theme.colors.gold} style={{ marginTop: 20 }} />
          ) : comments.length === 0 ? (
            <View style={styles.emptyComments}>
              <Ionicons name="chatbubble-outline" size={36} color={theme.colors.ash} />
              <Text style={[theme.typography.body, { color: theme.colors.ash, marginTop: 8 }]}>
                No comments yet. Be the first!
              </Text>
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id || item._id}
              style={{ flex: 1 }}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <View style={[styles.commentAvatar, { backgroundColor: theme.colors.copper + '44' }]}>
                    {item.authorAvatar ? (
                      <Image source={{ uri: item.authorAvatar }} style={styles.commentAvatarImg} />
                    ) : (
                      <Text style={{ color: theme.colors.copper, fontSize: 12, fontWeight: 'bold' }}>
                        {(item.authorName || '?')[0].toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[theme.typography.label, { color: theme.colors.ivory, fontSize: 11 }]}>
                      {item.authorName}
                    </Text>
                    <Text style={[theme.typography.body, { color: theme.colors.parchment, fontSize: 13, marginTop: 2 }]}>
                      {item.text}
                    </Text>
                  </View>
                </View>
              )}
            />
          )}

          {/* Input */}
          <View style={[styles.commentInputRow, { borderTopColor: theme.colors.borderSilver, backgroundColor: theme.colors.obsidian }]}>
            <TextInput
              placeholder="Add a comment..."
              placeholderTextColor={theme.colors.ash}
              style={[theme.typography.body, styles.commentInput, { color: theme.colors.ivory }]}
              value={commentText}
              onChangeText={setCommentText}
            />
            <TouchableOpacity onPress={handleAddComment} disabled={!commentText.trim()}>
              <Ionicons
                name="send"
                size={22}
                color={commentText.trim() ? theme.colors.gold : theme.colors.ash}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function PostCard({ post, onAuthorPress, onLike, onUnlike }) {
  const { theme } = useTheme();
  const { user, userProfile } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const heartScale = useRef(new Animated.Value(1)).current;

  // Use likedBy array or check against user id
  const postId = post._id || post.id;
  const likedByList = post.likedBy || [];
  const isLiked = likedByList.some(id =>
    id === user?.uid || id === user?._id || String(id) === String(user?.uid)
  );
  const likesCount = post.likes || 0;

  const toggleLike = async () => {
    if (!user) return;
    try {
      if (isLiked) {
        if (onUnlike) onUnlike(postId);
        else await postService.unlikePost(postId);
      } else {
        // Animate heart
        Animated.sequence([
          Animated.spring(heartScale, { toValue: 1.3, useNativeDriver: true, speed: 50 }),
          Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 50 }),
        ]).start();

        if (onLike) onLike(postId);
        else await postService.likePost(postId);
      }
    } catch (e) {
      console.log('Like error:', e);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this travel tip from ${post.authorName}: "${post.text}" — via TouristGuide App`,
      });
    } catch (error) {}
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const now = Date.now();
    const postTime = timestamp.toDate ? timestamp.toDate().getTime() : new Date(timestamp).getTime();
    const diff = now - postTime;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Resolve author fields for both MongoDB-populated and flat post shapes
  const authorName = post.authorName || post.authorId?.name || 'Traveler';
  const authorAvatar = post.authorAvatar || post.authorId?.avatar || '';
  const authorIdStr = post.authorIdStr || post.authorId?._id?.toString() || post.authorId || '';

  return (
    <>
      <GlassCard style={styles.postCard} glowOnPress={false}>
        {/* Header */}
        <View style={styles.postHeader}>
          <TouchableOpacity
            style={styles.postHeaderLeft}
            onPress={() => onAuthorPress?.(authorIdStr)}
            activeOpacity={0.7}
          >
            <View style={[styles.avatar, { backgroundColor: theme.colors.copper + '44' }]}>
              {authorAvatar ? (
                <Image source={{ uri: authorAvatar }} style={styles.avatarImg} />
              ) : (
                <Text style={[theme.typography.headingS, { color: theme.colors.copper }]}>
                  {(authorName || '?')[0].toUpperCase()}
                </Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[theme.typography.label, { color: theme.colors.ivory }]}>
                {authorName}
              </Text>
              <Text style={[theme.typography.caption, { color: theme.colors.parchment, marginTop: 2 }]}>
                {formatTime(post.createdAt)} • {post.location || 'Somewhere'}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.parchment} />
          </TouchableOpacity>
        </View>

        {/* Body */}
        <View style={styles.postBody}>
          {post.text ? (
            <Text style={[theme.typography.body, { color: theme.colors.ivory }]}>{post.text}</Text>
          ) : null}
          {post.imageUrl && (
            <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" />
          )}
        </View>

        {/* Actions */}
        <View style={[styles.postActions, { borderTopColor: theme.colors.borderSilver }]}>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <TouchableOpacity style={styles.statChip} onPress={toggleLike}>
              <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                <Ionicons
                  name={isLiked ? 'heart' : 'heart-outline'}
                  size={20}
                  color={isLiked ? theme.colors.crimson : theme.colors.parchment}
                />
              </Animated.View>
              <Text style={[theme.typography.caption, {
                color: isLiked ? theme.colors.crimson : theme.colors.parchment, marginLeft: 6
              }]}>
                {likesCount}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.statChip} onPress={() => setShowComments(true)}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={theme.colors.parchment} />
              <Text style={[theme.typography.caption, { color: theme.colors.parchment, marginLeft: 6 }]}>
                {post.commentsCount || 0}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', gap: 16 }}>
            <TouchableOpacity onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color={theme.colors.parchment} />
            </TouchableOpacity>
          </View>
        </View>
      </GlassCard>

      <CommentsModal
        visible={showComments}
        onClose={() => setShowComments(false)}
        postId={postId}
        postAuthorId={authorIdStr}
        theme={theme}
      />
    </>
  );
}

const styles = StyleSheet.create({
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
  
  // Modal styles
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
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  emptyComments: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  commentAvatar: {
    width: 32, height: 32, borderRadius: 16,
    marginRight: 12,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  commentAvatarImg: { width: 32, height: 32, borderRadius: 16 },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  commentInput: {
    flex: 1,
    padding: 10,
    marginRight: 12,
  },
});
