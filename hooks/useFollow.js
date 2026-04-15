// hooks/useFollow.js — Follow/Unfollow logic with private account support
import { useState, useEffect } from 'react';
import {
  doc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../constants/firebaseConfig';

/**
 * Custom hook for follow/unfollow logic.
 * Handles private accounts (pending requests) vs public (instant follow).
 *
 * @param {string} currentUserId - The logged-in user's UID
 * @param {string} targetUserId - The user being followed/unfollowed
 */
export default function useFollow(currentUserId, targetUserId) {
  const [followStatus, setFollowStatus] = useState('none'); // 'none' | 'pending' | 'following'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
      setLoading(false);
      return;
    }

    // Listen for real-time follow status changes
    const followsRef = collection(db, 'follows');
    const q = query(
      followsRef,
      where('followerId', '==', currentUserId),
      where('followingId', '==', targetUserId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setFollowStatus('none');
      } else {
        const followDoc = snapshot.docs[0].data();
        setFollowStatus(followDoc.status); // 'pending' or 'accepted'
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUserId, targetUserId]);

  /**
   * Follow a user.
   * If target is private → status = 'pending'
   * If target is public → status = 'accepted' + update counts
   */
  const followUser = async (isTargetPrivate) => {
    if (!currentUserId || !targetUserId) return;

    const followId = `${currentUserId}_${targetUserId}`;
    const status = isTargetPrivate ? 'pending' : 'accepted';

    await setDoc(doc(db, 'follows', followId), {
      followerId: currentUserId,
      followingId: targetUserId,
      status,
      createdAt: serverTimestamp(),
    });

    // For public accounts, update counts immediately
    if (!isTargetPrivate) {
      await updateDoc(doc(db, 'users', currentUserId), {
        followingCount: increment(1),
      });
      await updateDoc(doc(db, 'users', targetUserId), {
        followerCount: increment(1),
      });
    }

    // Create a notification for the target user
    const notifId = `follow_${followId}`;
    await setDoc(doc(db, 'notifications', notifId), {
      recipientId: targetUserId,
      type: isTargetPrivate ? 'follow_request' : 'new_follower',
      fromUserId: currentUserId,
      read: false,
      createdAt: serverTimestamp(),
    });

    setFollowStatus(status === 'accepted' ? 'following' : 'pending');
  };

  /**
   * Unfollow a user (or cancel pending request).
   */
  const unfollowUser = async () => {
    if (!currentUserId || !targetUserId) return;

    const followId = `${currentUserId}_${targetUserId}`;
    const followDocRef = doc(db, 'follows', followId);

    // Check current status to determine if we need to decrement counts
    const wasFollowing = followStatus === 'following' || followStatus === 'accepted';

    await deleteDoc(followDocRef);

    if (wasFollowing) {
      await updateDoc(doc(db, 'users', currentUserId), {
        followingCount: increment(-1),
      });
      await updateDoc(doc(db, 'users', targetUserId), {
        followerCount: increment(-1),
      });
    }

    // Remove the notification
    try {
      await deleteDoc(doc(db, 'notifications', `follow_${followId}`));
    } catch (e) {}

    setFollowStatus('none');
  };

  /**
   * Accept a follow request (called by the target user).
   */
  const acceptFollowRequest = async (requesterId) => {
    const followId = `${requesterId}_${currentUserId}`;
    const followDocRef = doc(db, 'follows', followId);

    await updateDoc(followDocRef, { status: 'accepted' });

    // Update counts
    await updateDoc(doc(db, 'users', requesterId), {
      followingCount: increment(1),
    });
    await updateDoc(doc(db, 'users', currentUserId), {
      followerCount: increment(1),
    });

    // Update notification
    try {
      await updateDoc(doc(db, 'notifications', `follow_${followId}`), {
        type: 'follow_accepted',
        recipientId: requesterId,
      });
    } catch (e) {}
  };

  /**
   * Decline a follow request.
   */
  const declineFollowRequest = async (requesterId) => {
    const followId = `${requesterId}_${currentUserId}`;
    await deleteDoc(doc(db, 'follows', followId));

    try {
      await deleteDoc(doc(db, 'notifications', `follow_${followId}`));
    } catch (e) {}
  };

  return {
    followStatus: followStatus === 'accepted' ? 'following' : followStatus,
    loading,
    followUser,
    unfollowUser,
    acceptFollowRequest,
    declineFollowRequest,
  };
}
