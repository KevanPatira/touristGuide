// controllers/follow.controller.js — Follow/unfollow with notification triggers
const Follow = require('../models/Follow');
const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * Follow a user
 * POST /api/follows/:userId
 */
exports.followUser = async (req, res) => {
  try {
    const targetId = req.params.userId;
    if (targetId === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot follow yourself' });
    }

    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });

    // Check if already following
    const existing = await Follow.findOne({ followerId: req.user.id, followingId: targetId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Already following or request pending', status: existing.status });
    }

    const status = 'pending';

    await Follow.create({
      followerId: req.user.id,
      followingId: targetId,
      status,
    });

    // Notification
    await Notification.create({
      recipientId: targetId,
      fromUserId: req.user.id,
      type: 'follow_request',
    });

    res.json({ success: true, status });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Already following' });
    }
    console.error('Follow error:', error);
    res.status(500).json({ success: false, message: 'Failed to follow user' });
  }
};

/**
 * Unfollow a user (or cancel pending request)
 * DELETE /api/follows/:userId
 */
exports.unfollowUser = async (req, res) => {
  try {
    const targetId = req.params.userId;
    const follow = await Follow.findOne({ followerId: req.user.id, followingId: targetId });
    if (!follow) {
      return res.status(404).json({ success: false, message: 'Not following this user' });
    }

    const wasAccepted = follow.status === 'accepted';
    await Follow.findByIdAndDelete(follow._id);

    if (wasAccepted) {
      await User.findByIdAndUpdate(req.user.id, { $inc: { followingCount: -1 } });
      await User.findByIdAndUpdate(targetId, { $inc: { followerCount: -1 } });
    }

    // Clean up notification
    await Notification.deleteOne({
      fromUserId: req.user.id,
      recipientId: targetId,
      type: { $in: ['new_follower', 'follow_request'] },
    });

    res.json({ success: true, message: 'Unfollowed' });
  } catch (error) {
    console.error('Unfollow error:', error);
    res.status(500).json({ success: false, message: 'Failed to unfollow' });
  }
};

/**
 * Accept a follow request
 * PUT /api/follows/:userId/accept
 */
exports.acceptFollow = async (req, res) => {
  try {
    const requesterId = req.params.userId;
    const follow = await Follow.findOne({ followerId: requesterId, followingId: req.user.id, status: 'pending' });
    if (!follow) {
      return res.status(404).json({ success: false, message: 'No pending request from this user' });
    }

    follow.status = 'accepted';
    await follow.save();

    await User.findByIdAndUpdate(requesterId, { $inc: { followingCount: 1 } });
    await User.findByIdAndUpdate(req.user.id, { $inc: { followerCount: 1 } });

    // Notification
    await Notification.create({
      recipientId: requesterId,
      fromUserId: req.user.id,
      type: 'follow_accepted',
    });

    res.json({ success: true, message: 'Follow request accepted' });
  } catch (error) {
    console.error('Accept follow error:', error);
    res.status(500).json({ success: false, message: 'Failed to accept follow' });
  }
};

/**
 * Decline a follow request
 * DELETE /api/follows/:userId/decline
 */
exports.declineFollow = async (req, res) => {
  try {
    const requesterId = req.params.userId;
    const follow = await Follow.findOneAndDelete({ followerId: requesterId, followingId: req.user.id, status: 'pending' });
    if (!follow) {
      return res.status(404).json({ success: false, message: 'No pending request from this user' });
    }

    res.json({ success: true, message: 'Follow request declined' });
  } catch (error) {
    console.error('Decline follow error:', error);
    res.status(500).json({ success: false, message: 'Failed to decline follow' });
  }
};

/**
 * Check follow status between current user and target
 * GET /api/follows/status/:userId
 */
exports.checkFollowStatus = async (req, res) => {
  try {
    const targetId = req.params.userId;
    const follow = await Follow.findOne({ followerId: req.user.id, followingId: targetId });

    res.json({
      success: true,
      status: follow ? (follow.status === 'accepted' ? 'following' : follow.status) : 'none',
    });
  } catch (error) {
    console.error('Check follow status error:', error);
    res.status(500).json({ success: false, message: 'Failed to check follow status' });
  }
};

/**
 * Get followers of a user
 * GET /api/follows/followers/:userId?page=1&limit=20
 */
exports.getFollowers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [follows, total] = await Promise.all([
      Follow.find({ followingId: req.params.userId, status: 'accepted' })
        .skip(skip).limit(limitNum)
        .populate('followerId', 'name username avatar bio')
        .lean(),
      Follow.countDocuments({ followingId: req.params.userId, status: 'accepted' }),
    ]);

    const followers = follows.map(f => ({
      uid: f.followerId?._id,
      displayName: f.followerId?.name || 'Unknown',
      username: f.followerId?.username || '',
      avatarUrl: f.followerId?.avatar || '',
      bio: f.followerId?.bio || '',
    }));

    res.json({
      success: true,
      data: followers,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch followers' });
  }
};

/**
 * Get users that a user is following
 * GET /api/follows/following/:userId?page=1&limit=20
 */
exports.getFollowing = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [follows, total] = await Promise.all([
      Follow.find({ followerId: req.params.userId, status: 'accepted' })
        .skip(skip).limit(limitNum)
        .populate('followingId', 'name username avatar bio')
        .lean(),
      Follow.countDocuments({ followerId: req.params.userId, status: 'accepted' }),
    ]);

    const following = follows.map(f => ({
      uid: f.followingId?._id,
      displayName: f.followingId?.name || 'Unknown',
      username: f.followingId?.username || '',
      avatarUrl: f.followingId?.avatar || '',
      bio: f.followingId?.bio || '',
    }));

    res.json({
      success: true,
      data: following,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch following' });
  }
};
