// hooks/usePosts.js — Community posts backed by MongoDB API
import { useState, useCallback, useRef } from 'react';
import * as postService from '../services/post.service';

export default function usePosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
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
   * Create a post
   */
  const createPost = useCallback(async (text, imageUrl, location) => {
    const res = await postService.createPost(text, imageUrl, location);
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
    fetchPosts,
    loadMore,
    onRefresh,
    createPost,
    likePost,
    unlikePost,
    deletePost,
  };
}
