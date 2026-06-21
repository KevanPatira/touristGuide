// controllers/album.controller.js — CRUD for trip albums + badge awarding
const Album = require('../models/Album');
const User = require('../models/User');

// Badge milestone definitions
const BADGE_MILESTONES = [
  { tripCount: 1,   badgeId: 'first_trip',    name: 'First Trip',    tier: 1, points: 50,  description: 'Completed your first trip!' },
  { tripCount: 3,   badgeId: 'trail_starter',  name: 'Trail Starter', tier: 2, points: 100, description: '3 trips completed — you\'re on a roll!' },
  { tripCount: 5,   badgeId: 'explorer',       name: 'Explorer',      tier: 3, points: 200, description: '5 trips! A true explorer.' },
  { tripCount: 10,  badgeId: 'adventurer',     name: 'Adventurer',    tier: 4, points: 350, description: '10 trips conquered!' },
  { tripCount: 25,  badgeId: 'trailblazer',    name: 'Trailblazer',   tier: 5, points: 500, description: '25 trips — blazing new trails!' },
  { tripCount: 50,  badgeId: 'globe_trotter',  name: 'Globe Trotter', tier: 6, points: 800, description: '50 trips across the globe!' },
  { tripCount: 100, badgeId: 'legend',         name: 'Legend',        tier: 7, points: 1500, description: '100 trips — you are a legend!' },
];

/**
 * Check and award badges based on trip count
 */
async function checkAndAwardBadges(userId, newTripCount) {
  const user = await User.findById(userId);
  if (!user) return [];

  const earnedBadgeIds = (user.badges || []).map(b => b.badgeId);
  const newBadges = [];

  for (const milestone of BADGE_MILESTONES) {
    if (newTripCount >= milestone.tripCount && !earnedBadgeIds.includes(milestone.badgeId)) {
      newBadges.push({
        badgeId: milestone.badgeId,
        name: milestone.name,
        tier: milestone.tier,
        points: milestone.points,
        earnedAt: new Date(),
      });
    }
  }

  if (newBadges.length > 0) {
    const totalNewPoints = newBadges.reduce((sum, b) => sum + b.points, 0);
    await User.findByIdAndUpdate(userId, {
      $push: { badges: { $each: newBadges } },
      $inc: { achievementPoints: totalNewPoints },
    });
  }

  return newBadges;
}

/**
 * Create a new trip album
 * POST /api/albums
 */
exports.createAlbum = async (req, res) => {
  try {
    const { name, media } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Album name is required' });
    }

    if (!media || !Array.isArray(media) || media.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one media item is required' });
    }

    // Create the album
    const album = await Album.create({
      userId: req.user.id,
      name: name.trim(),
      media,
      coverUrl: media[0]?.url || null,
      mediaCount: media.length,
    });

    // Increment trip count
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $inc: { tripCount: 1 } },
      { new: true }
    );

    // Check and award badges
    const newBadges = await checkAndAwardBadges(req.user.id, updatedUser.tripCount);

    res.status(201).json({
      success: true,
      data: album,
      newBadges,
      tripCount: updatedUser.tripCount,
    });
  } catch (error) {
    console.error('Create album error:', error);
    res.status(500).json({ success: false, message: 'Failed to create album' });
  }
};

/**
 * Get all albums for authenticated user
 * GET /api/albums
 */
exports.getMyAlbums = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [albums, total] = await Promise.all([
      Album.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Album.countDocuments({ userId: req.user.id }),
    ]);

    res.json({
      success: true,
      data: albums,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + albums.length < total,
      },
    });
  } catch (error) {
    console.error('Get albums error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch albums' });
  }
};

/**
 * Get a single album by ID
 * GET /api/albums/:id
 */
exports.getAlbum = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id).lean();

    if (!album) {
      return res.status(404).json({ success: false, message: 'Album not found' });
    }

    // Only allow owner to view (for now)
    if (album.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this album' });
    }

    res.json({ success: true, data: album });
  } catch (error) {
    console.error('Get album error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch album' });
  }
};

/**
 * Delete an album
 * DELETE /api/albums/:id
 */
exports.deleteAlbum = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);

    if (!album) {
      return res.status(404).json({ success: false, message: 'Album not found' });
    }

    if (album.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this album' });
    }

    await Album.findByIdAndDelete(req.params.id);

    // Decrement trip count (don't go below 0)
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { tripCount: -1 },
    });

    // Fix if it went below 0
    await User.updateOne(
      { _id: req.user.id, tripCount: { $lt: 0 } },
      { $set: { tripCount: 0 } }
    );

    res.json({ success: true, message: 'Album deleted' });
  } catch (error) {
    console.error('Delete album error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete album' });
  }
};

// Export badge milestones for use by achievement controller
exports.BADGE_MILESTONES = BADGE_MILESTONES;
