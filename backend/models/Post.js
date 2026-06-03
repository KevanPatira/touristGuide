// models/Post.js — Community post schema with media support
const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, default: null },
  type: { type: String, enum: ['image', 'video'], default: 'image' },
  width: { type: Number, default: null },
  height: { type: Number, default: null },
}, { _id: false });

const PostSchema = new mongoose.Schema({
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  text: {
    type: String,
    trim: true,
    maxlength: [2000, 'Post cannot exceed 2000 characters'],
    default: '',
  },
  // Legacy single image field (kept for backward compatibility)
  imageUrl: {
    type: String,
    default: null,
  },
  // New: array of media attachments (images/videos)
  media: {
    type: [MediaSchema],
    default: [],
    validate: [arr => arr.length <= 10, 'Maximum 10 media items per post'],
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

// Virtual: combine legacy imageUrl + media array for rendering
PostSchema.virtual('allMedia').get(function () {
  const items = [...this.media];
  if (this.imageUrl && !items.some(m => m.url === this.imageUrl)) {
    items.unshift({ url: this.imageUrl, type: 'image', publicId: null });
  }
  return items;
});

module.exports = mongoose.model('Post', PostSchema);
