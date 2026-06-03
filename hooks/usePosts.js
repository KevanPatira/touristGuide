// hooks/usePosts.js — Community posts backed by MongoDB API with media upload
import { useState, useCallback, useRef } from 'react';
import * as postService from '../services/post.service';
import { uploadMedia, uploadMultipleMedia } from '../services/media.service';

export default function usePosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const pageRef = useRef(1);
  const sortRef = useRef('recent');

  /**
   * Fetch posts (first page or reset)
   */
  const fetchPosts = useCallback(async (sort = 'recent', userId = null) => {
    try {
      setLoading(true);
      sortRef.current = sort;
      pageRef.current = 1;
      const res = await postService.getPosts(sort, 1, 15, userId);
      setPosts(res.data || []);
      setHasMore(res.pagination?.hasMore || false);
    } catch (e) {
      console.log('[usePosts] Fetch failed:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /**
   * Load more (next page)
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    try {
      pageRef.current += 1;
      const res = await postService.getPosts(sortRef.current, pageRef.current, 15);
      setPosts(prev => [...prev, ...(res.data || [])]);
      setHasMore(res.pagination?.hasMore || false);
    } catch (e) {
      console.log('[usePosts] Load more failed:', e.message);
    }
  }, [hasMore, loading]);

  /**
   * Pull-to-refresh
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts(sortRef.current);
  }, [fetchPosts]);

  /**
   * Create a post with optional multi-media upload to Cloudinary.
   * @param {string} text - post text
   * @param {Array} mediaItems - array of local media objects {uri, type}
   * @param {string} location - location label
   * @returns {object} created post
   */
  const createPost = useCallback(async (text, mediaItems = [], location) => {
    let uploadedMedia = [];

    // Upload media to Cloudinary if provided
    if (mediaItems && mediaItems.length > 0) {
      try {
        setIsUploading(true);
        setUploadProgress(0);

        const results = await uploadMultipleMedia(mediaItems, (index, pct) => {
          // Average progress roughly across all files
          const overallProgress = Math.round(((index * 100) + pct) / mediaItems.length);
          setUploadProgress(overallProgress);
        });

        uploadedMedia = results.map(res => ({
          url: res.url,
          publicId: res.publicId,
          type: res.type || 'image',
          width: res.width,
          height: res.height,
        }));
      } catch (e) {
        console.log('[usePosts] Media upload failed:', e.message);
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    }

    // Create the post — pass the Cloudinary URL in imageUrl for backward compat
    const imageUrl = uploadedMedia.length > 0 ? uploadedMedia[0].url : null;
    const res = await postService.createPost(text, imageUrl, location, uploadedMedia);

    // Prepend to list
    setPosts(prev => [res.data, ...prev]);
    return res.data;
  }, []);

  /**
   * Like a post
   */
  const likePost = useCallback(async (postId) => {
    try {
      const res = await postService.likePost(postId);
      setPosts(prev => prev.map(p =>
        (p._id || p.id) === postId
          ? { ...p, likes: res.data.likes, likedBy: res.data.likedBy }
          : p
      ));
    } catch (e) {
      console.log('[usePosts] Like failed:', e.message);
    }
  }, []);

  /**
   * Unlike a post
   */
  const unlikePost = useCallback(async (postId) => {
    try {
      const res = await postService.unlikePost(postId);
      setPosts(prev => prev.map(p =>
        (p._id || p.id) === postId
          ? { ...p, likes: res.data.likes, likedBy: res.data.likedBy }
          : p
      ));
    } catch (e) {
      console.log('[usePosts] Unlike failed:', e.message);
    }
  }, []);

  /**
   * Delete a post
   */
  const deletePost = useCallback(async (postId) => {
    try {
      await postService.deletePost(postId);
      setPosts(prev => prev.filter(p => (p._id || p.id) !== postId));
    } catch (e) {
      console.log('[usePosts] Delete failed:', e.message);
      throw e;
    }
  }, []);

  return {
    posts,
    loading,
    refreshing,
    hasMore,
    uploadProgress,
    isUploading,
    fetchPosts,
    loadMore,
    onRefresh,
    createPost,
    likePost,
    unlikePost,
    deletePost,
  };
}
