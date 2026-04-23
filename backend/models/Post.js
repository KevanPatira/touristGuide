// models/Post.js — Community post schema
const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  text: {
    type: String,
    required: [true, 'Post text is required'],
    trim: true,
    maxlength: [2000, 'Post cannot exceed 2000 characters'],
  },
  imageUrl: {
    type: String,
    default: null,
  },
  location: {
    type: String,
    default: 'My Location',
  },
  likes: {
    type: Number,
    default: 0,
    min: 0,
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  commentsCount: {
    type: Number,
    default: 0,
    min: 0,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

// Indexes for feed queries
PostSchema.index({ createdAt: -1 });
PostSchema.index({ likes: -1, createdAt: -1 });
PostSchema.index({ authorId: 1, createdAt: -1 });

module.exports = mongoose.model('Post', PostSchema);
