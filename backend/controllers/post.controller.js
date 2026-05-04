// controllers/post.controller.js — Community posts CRUD + social actions
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Follow = require('../models/Follow');

/**
 * Create a new post
 * POST /api/posts
 */
exports.createPost = async (req, res) => {
  try {
    const { text, imageUrl, location } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Post text is required' });
    }

    const author = await User.findById(req.user.id);
    if (!author) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const post = await Post.create({
      authorId: req.user.id,
      text: text.trim(),
      imageUrl: imageUrl || null,
      location: location || 'My Location',
    });

    // Increment user's post count
    await User.findByIdAndUpdate(req.user.id, { $inc: { postCount: 1 } });

    // Notify all followers about the new post
    try {
      const followers = await Follow.find({ followingId: req.user.id, status: 'accepted' }).select('followerId');
      const notifications = followers.map(f => ({
        recipientId: f.followerId,
        fromUserId: req.user.id,
        type: 'new_post',
        postId: post._id,
      }));
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (notifErr) {
      console.log('Post notification error:', notifErr.message);
    }

    // Return post with author info
    const populatedPost = await Post.findById(post._id).populate('authorId', 'name username avatar');

    res.status(201).json({
      success: true,
      data: populatedPost,
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ success: false, message: 'Failed to create post' });
  }
};

/**
 * Get paginated feed of posts
 * GET /api/posts?sort=recent|popular&page=1&limit=15&userId=xxx
 */
exports.getPosts = async (req, res) => {
  try {
    const { sort = 'recent', page = 1, limit = 15, userId } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (userId) filter.authorId = userId;

    let sortOrder = { createdAt: -1 };
    if (sort === 'popular') sortOrder = { likes: -1, createdAt: -1 };

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort(sortOrder)
        .skip(skip)
        .limit(limitNum)
        .populate('authorId', 'name username avatar')
        .lean(),
      Post.countDocuments(filter),
    ]);

    // Map authorId to author fields for frontend compatibility
    const mapped = posts.map(p => ({
      ...p,
      id: p._id,
      authorName: p.authorId?.name || 'Traveler',
      authorAvatar: p.authorId?.avatar || '',
      authorUsername: p.authorId?.username || '',
      authorIdStr: p.authorId?._id?.toString() || '',
    }));

    res.json({
      success: true,
      data: mapped,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasMore: pageNum * limitNum < total,
      },
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch posts' });
  }
};

/**
 * Like a post
 * POST /api/posts/:id/like
 */
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const alreadyLiked = post.likedBy.includes(req.user.id);
    if (alreadyLiked) {
      return res.status(400).json({ success: false, message: 'Already liked' });
    }

    post.likedBy.push(req.user.id);
    post.likes = post.likedBy.length;
    await post.save();

    // Notify post author (don't notify yourself)
    if (post.authorId.toString() !== req.user.id) {
      await Notification.create({
        recipientId: post.authorId,
        fromUserId: req.user.id,
        type: 'like',
        postId: post._id,
      });
    }

    res.json({ success: true, data: { likes: post.likes, likedBy: post.likedBy } });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ success: false, message: 'Failed to like post' });
  }
};

/**
 * Unlike a post
 * POST /api/posts/:id/unlike
 */
exports.unlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    post.likedBy = post.likedBy.filter(id => id.toString() !== req.user.id);
    post.likes = post.likedBy.length;
    await post.save();

    res.json({ success: true, data: { likes: post.likes, likedBy: post.likedBy } });
  } catch (error) {
    console.error('Unlike post error:', error);
    res.status(500).json({ success: false, message: 'Failed to unlike post' });
  }
};

/**
 * Delete a post (only by author)
 * DELETE /api/posts/:id
 */
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    if (post.authorId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(req.params.id);
    await User.findByIdAndUpdate(req.user.id, { $inc: { postCount: -1 } });

    // Clean up related notifications
    await Notification.deleteMany({ postId: req.params.id });

    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete post' });
  }
};
