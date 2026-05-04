// components/ui/PostCard.js — MongoDB-backed PostCard with comments, delete, and views
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

// ═══ Views Modal — shows who viewed the post ═══
function ViewsModal({ visible, onClose, post, theme }) {
  const viewsCount = post.views || post.viewsCount || 0;
  const viewedBy = post.viewedBy || [];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.midnight, height: '50%' }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.borderSilver }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="eye" size={20} color={theme.colors.gold} />
              <Text style={[theme.typography.headingS, { color: theme.colors.ivory }]}>
                Views ({viewsCount})
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.parchment} />
            </TouchableOpacity>
          </View>

          {/* Viewers List */}
          {viewedBy.length === 0 ? (
            <View style={styles.emptyComments}>
              <Ionicons name="eye-off-outline" size={36} color={theme.colors.ash} />
              <Text style={[theme.typography.body, { color: theme.colors.ash, marginTop: 8, textAlign: 'center' }]}>
                No view data available yet.{'\n'}Views will be tracked as users see this post.
              </Text>
            </View>
          ) : (
            <FlatList
              data={viewedBy}
              keyExtractor={(item, index) => item._id || item.id || String(index)}
              style={{ flex: 1 }}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <View style={[styles.commentAvatar, { backgroundColor: theme.colors.copper + '44' }]}>
                    {item.avatar ? (
                      <Image source={{ uri: item.avatar }} style={styles.commentAvatarImg} />
                    ) : (
                      <Text style={{ color: theme.colors.copper, fontSize: 12, fontWeight: 'bold' }}>
                        {(item.name || '?')[0].toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <Text style={[theme.typography.label, { color: theme.colors.ivory, fontSize: 13 }]}>
                    {item.name || 'Anonymous'}
                  </Text>
                </View>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

// ═══ Post Options Menu (triple-dot dropdown) ═══
function PostOptionsMenu({ visible, onClose, onDelete, onViewViews, isOwner, theme }) {
  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <TouchableOpacity
        style={styles.optionsOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.optionsMenu, { backgroundColor: theme.colors.midnight, borderColor: theme.colors.borderSilver }]}>
          {/* View post views */}
          <TouchableOpacity
            style={[styles.optionItem, { borderBottomColor: theme.colors.borderSilver }]}
            onPress={() => { onClose(); onViewViews(); }}
          >
            <Ionicons name="eye-outline" size={20} color={theme.colors.gold} />
            <Text style={[theme.typography.body, { color: theme.colors.ivory, marginLeft: 12 }]}>
              View post views
            </Text>
          </TouchableOpacity>

          {/* Delete post — only for the author */}
          {isOwner && (
            <TouchableOpacity
              style={[styles.optionItem, styles.optionItemDanger]}
              onPress={() => { onClose(); onDelete(); }}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={[theme.typography.body, { color: '#EF4444', marginLeft: 12 }]}>
                Delete post
              </Text>
            </TouchableOpacity>
          )}

          {/* Cancel */}
          <TouchableOpacity
            style={styles.optionItem}
            onPress={onClose}
          >
            <Ionicons name="close-outline" size={20} color={theme.colors.ash} />
            <Text style={[theme.typography.body, { color: theme.colors.ash, marginLeft: 12 }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export default function PostCard({ post, onAuthorPress, onLike, onUnlike, onDelete }) {
  const { theme } = useTheme();
  const { user, userProfile } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [showViews, setShowViews] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const heartScale = useRef(new Animated.Value(1)).current;

  // ── Entrance animation ──
  const entranceFade = useRef(new Animated.Value(0)).current;
  const entranceSlide = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(entranceFade, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(entranceSlide, { toValue: 0, speed: 14, bounciness: 4, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Double-tap like overlay ──
  const doubleTapHeartOpacity = useRef(new Animated.Value(0)).current;
  const doubleTapHeartScale = useRef(new Animated.Value(0)).current;
  const lastTapRef = useRef(0);

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      if (!isLiked) {
        // Trigger like
        Animated.sequence([
          Animated.spring(heartScale, { toValue: 1.3, useNativeDriver: true, speed: 50 }),
          Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 50 }),
        ]).start();
        if (onLike) onLike(postId);
      }
      // Show large heart overlay
      doubleTapHeartOpacity.setValue(1);
      doubleTapHeartScale.setValue(0);
      Animated.sequence([
        Animated.spring(doubleTapHeartScale, { toValue: 1, speed: 12, bounciness: 8, useNativeDriver: true }),
        Animated.delay(400),
        Animated.timing(doubleTapHeartOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
    lastTapRef.current = now;
  };

  // Use likedBy array or check against user id
  const postId = post._id || post.id;
  const likedByList = post.likedBy || [];
  const isLiked = likedByList.some(id =>
    id === user?.uid || id === user?._id || String(id) === String(user?.uid)
  );
  const likesCount = post.likes || 0;

  // Check if current user is the post author
  const authorIdStr = post.authorIdStr || post.authorId?._id?.toString() || post.authorId || '';
  const isOwner = authorIdStr === user?.uid || authorIdStr === user?._id;

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

  const handleDelete = () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (onDelete) {
                await onDelete(postId);
              } else {
                await postService.deletePost(postId);
              }
            } catch (e) {
              Alert.alert('Error', 'Could not delete this post. Please try again.');
            }
          },
        },
      ]
    );
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

  return (
    <>
      <Animated.View style={{ opacity: entranceFade, transform: [{ translateY: entranceSlide }] }}>
        <GlassCard style={styles.postCard} glowOnPress={false} glowColor={theme.colors.gold}>
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
            {/* Triple dot menu */}
            <TouchableOpacity onPress={() => setShowOptions(true)}>
              <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.parchment} />
            </TouchableOpacity>
          </View>

          {/* Body — double-tap for like */}
          <TouchableOpacity activeOpacity={1} onPress={handleDoubleTap}>
            <View style={styles.postBody}>
              {post.text ? (
                <Text style={[theme.typography.body, { color: theme.colors.ivory }]}>{post.text}</Text>
              ) : null}
              {post.imageUrl && (
                <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" />
              )}
              {/* Double-tap heart overlay */}
              <Animated.View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: doubleTapHeartOpacity,
                  transform: [{ scale: doubleTapHeartScale }],
                }}
              >
                <Ionicons name="heart" size={72} color={theme.colors.crimson} />
              </Animated.View>
            </View>
          </TouchableOpacity>

          {/* Actions */}
          <View style={[styles.postActions, { borderTopColor: theme.colors.borderSilver }]}>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              {/* Like */}
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

              {/* Comments */}
              <TouchableOpacity style={styles.statChip} onPress={() => setShowComments(true)}>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color={theme.colors.parchment} />
                <Text style={[theme.typography.caption, { color: theme.colors.parchment, marginLeft: 6 }]}>
                  {post.commentsCount || 0}
                </Text>
              </TouchableOpacity>

              {/* Views */}
              <TouchableOpacity style={styles.statChip} onPress={() => setShowViews(true)}>
                <Ionicons name="eye-outline" size={20} color={theme.colors.parchment} />
                <Text style={[theme.typography.caption, { color: theme.colors.parchment, marginLeft: 6 }]}>
                  {post.views || post.viewsCount || 0}
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
      </Animated.View>

      {/* Modals */}
      <CommentsModal
        visible={showComments}
        onClose={() => setShowComments(false)}
        postId={postId}
        postAuthorId={authorIdStr}
        theme={theme}
      />

      <ViewsModal
        visible={showViews}
        onClose={() => setShowViews(false)}
        post={post}
        theme={theme}
      />

      <PostOptionsMenu
        visible={showOptions}
        onClose={() => setShowOptions(false)}
        onDelete={handleDelete}
        onViewViews={() => setShowViews(true)}
        isOwner={isOwner}
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
    paddingHorizontal: 24,
  },
  commentItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
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
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  commentInput: {
    flex: 1,
    padding: 10,
    marginRight: 12,
  },

  // Options menu (triple-dot dropdown)
  optionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsMenu: {
    width: '75%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    paddingVertical: 8,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  optionItemDanger: {
    // no extra styling needed, color handled inline
  },
});
