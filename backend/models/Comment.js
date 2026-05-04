// models/Comment.js — Comment schema linked to posts
const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: [true, 'Comment text is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters'],
  },
}, {
  timestamps: true,
});

// Index for fetching comments by post
CommentSchema.index({ postId: 1, createdAt: 1 });

module.exports = mongoose.model('Comment', CommentSchema);
