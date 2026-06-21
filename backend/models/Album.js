// models/Album.js — Trip album schema for storing photo/video collections
const mongoose = require('mongoose');

const AlbumMediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, default: null },
  type: { type: String, enum: ['image', 'video'], default: 'image' },
  width: { type: Number, default: null },
  height: { type: Number, default: null },
}, { _id: false });

const AlbumSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Album name is required'],
    trim: true,
    maxlength: [100, 'Album name cannot exceed 100 characters'],
  },
  media: {
    type: [AlbumMediaSchema],
    default: [],
    validate: [arr => arr.length <= 50, 'Maximum 50 media items per album'],
  },
  coverUrl: {
    type: String,
    default: null,
  },
  mediaCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

// Compound index for user's albums sorted by date
AlbumSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Album', AlbumSchema);
