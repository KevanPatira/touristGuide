// controllers/achievement.controller.js — Leaderboard & badge queries
const User = require('../models/User');
const { BADGE_MILESTONES } = require('./album.controller');

/**
 * Get global leaderboard ranked by achievementPoints
 * GET /api/achievements/leaderboard?page=1&limit=20&search=query
 */
exports.getLeaderboard = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim();

    // Build query filter
    const filter = { achievementPoints: { $gt: 0 } };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('name username avatar achievementPoints badges tripCount followerCount')
        .sort({ achievementPoints: -1, tripCount: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    // Add rank numbers (accounting for pagination)
    const rankedUsers = users.map((u, i) => ({
      ...u,
      rank: skip + i + 1,
      badgeCount: (u.badges || []).length,
      latestBadge: (u.badges || []).sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))[0] || null,
    }));

    res.json({
      success: true,
      data: rankedUsers,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + users.length < total,
      },
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leaderboard' });
  }
};

/**
 * Get current user's achievements + global rank
 * GET /api/achievements/me
 */
exports.getMyAchievements = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('name username avatar achievementPoints badges tripCount')
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Calculate global rank
    const rank = await User.countDocuments({
      achievementPoints: { $gt: user.achievementPoints },
    }) + 1;

    // Total users with any points
    const totalRanked = await User.countDocuments({
      achievementPoints: { $gt: 0 },
    });

    // Next badge milestone
    const nextMilestone = BADGE_MILESTONES.find(m => m.tripCount > (user.tripCount || 0)) || null;

    res.json({
      success: true,
      data: {
        ...user,
        rank,
        totalRanked: Math.max(totalRanked, 1),
        badgeCount: (user.badges || []).length,
        latestBadge: (user.badges || []).sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))[0] || null,
        nextMilestone,
        allMilestones: BADGE_MILESTONES,
      },
    });
  } catch (error) {
    console.error('My achievements error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch achievements' });
  }
};

/**
 * Get any user's achievements
 * GET /api/achievements/user/:userId
 */
exports.getUserAchievements = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('name username avatar achievementPoints badges tripCount')
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const rank = await User.countDocuments({
      achievementPoints: { $gt: user.achievementPoints },
    }) + 1;

    res.json({
      success: true,
      data: {
        ...user,
        rank,
        badgeCount: (user.badges || []).length,
        latestBadge: (user.badges || []).sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))[0] || null,
      },
    });
  } catch (error) {
    console.error('User achievements error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user achievements' });
  }
};
