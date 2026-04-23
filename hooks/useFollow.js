// hooks/useFollow.js — Follow/unfollow logic backed by MongoDB API
import { useState, useEffect, useCallback } from 'react';
import * as followService from '../services/follow.service';

/**
 * Custom hook for follow/unfollow logic.
 * All data from MongoDB — no Firebase dependency.
 *
 * @param {string} currentUserId - The logged-in user's _id
 * @param {string} targetUserId - The user being followed/unfollowed
 */
export default function useFollow(currentUserId, targetUserId) {
  const [followStatus, setFollowStatus] = useState('none'); // 'none' | 'pending' | 'following'
  const [loading, setLoading] = useState(true);

  // Fetch initial follow status
  useEffect(() => {
    if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
      setLoading(false);
      return;
    }

    let mounted = true;
    const fetchStatus = async () => {
      try {
        const res = await followService.checkFollowStatus(targetUserId);
        if (mounted) setFollowStatus(res.status);
      } catch (e) {
        console.log('[useFollow] Status check failed:', e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchStatus();
    return () => { mounted = false; };
  }, [currentUserId, targetUserId]);

  /**
   * Follow a user
   */
  const followUser = useCallback(async () => {
    if (!currentUserId || !targetUserId) return;
    try {
      const res = await followService.followUser(targetUserId);
      setFollowStatus(res.status === 'accepted' ? 'following' : 'pending');
    } catch (e) {
      console.log('[useFollow] Follow failed:', e.message);
      throw e;
    }
  }, [currentUserId, targetUserId]);

  /**
   * Unfollow a user (or cancel pending request)
   */
  const unfollowUser = useCallback(async () => {
    if (!currentUserId || !targetUserId) return;
    try {
      await followService.unfollowUser(targetUserId);
      setFollowStatus('none');
    } catch (e) {
      console.log('[useFollow] Unfollow failed:', e.message);
      throw e;
    }
  }, [currentUserId, targetUserId]);

  /**
   * Accept a follow request (called by the target user)
   */
  const acceptFollowRequest = useCallback(async (requesterId) => {
    try {
      await followService.acceptFollow(requesterId);
    } catch (e) {
      console.log('[useFollow] Accept failed:', e.message);
      throw e;
    }
  }, []);

  /**
   * Decline a follow request
   */
  const declineFollowRequest = useCallback(async (requesterId) => {
    try {
      await followService.declineFollow(requesterId);
    } catch (e) {
      console.log('[useFollow] Decline failed:', e.message);
      throw e;
    }
  }, []);

  return {
    followStatus,
    loading,
    followUser,
    unfollowUser,
    acceptFollowRequest,
    declineFollowRequest,
  };
}
