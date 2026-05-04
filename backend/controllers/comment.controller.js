// controllers/comment.controller.js — Comment CRUD with notifications
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * Add a comment to a post
 * POST /api/comments/:postId
 */
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const comment = await Comment.create({
      postId: req.params.postId,
      authorId: req.user.id,
      text: text.trim(),
    });

    // Increment comment count on the post
    await Post.findByIdAndUpdate(req.params.postId, { $inc: { commentsCount: 1 } });

    // Notify post author (don't notify yourself)
    if (post.authorId.toString() !== req.user.id) {
      await Notification.create({
        recipientId: post.authorId,
        fromUserId: req.user.id,
        type: 'comment',
        postId: post._id,
      });
    }

    // Populate author info for response
    const populated = await Comment.findById(comment._id).populate('authorId', 'name username avatar');

    res.status(201).json({
      success: true,
      data: {
        ...populated.toObject(),
        id: populated._id,
        authorName: populated.authorId?.name || 'Traveler',
        authorAvatar: populated.authorId?.avatar || '',
      },
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
};

/**
 * Get comments for a post (paginated)
 * GET /api/comments/:postId?page=1&limit=20
 */
exports.getComments = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [comments, total] = await Promise.all([
      Comment.find({ postId: req.params.postId })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limitNum)
        .populate('authorId', 'name username avatar')
        .lean(),
      Comment.countDocuments({ postId: req.params.postId }),
    ]);

    const mapped = comments.map(c => ({
      ...c,
      id: c._id,
      authorName: c.authorId?.name || 'Traveler',
      authorAvatar: c.authorId?.avatar || '',
    }));

    res.json({
      success: true,
      data: mapped,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch comments' });
  }
};

/**
 * Delete a comment (only by author)
 * DELETE /api/comments/:id
 */
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    if (comment.authorId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Comment.findByIdAndDelete(req.params.id);
    await Post.findByIdAndUpdate(comment.postId, { $inc: { commentsCount: -1 } });

    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete comment' });
  }
};
