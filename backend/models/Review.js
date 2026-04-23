// models/Review.js — User reviews for destinations
const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  destinationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Destination',
    required: [true, 'Destination ID is required'],
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
  },
  title: {
    type: String,
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  body: {
    type: String,
    maxlength: [2000, 'Review body cannot exceed 2000 characters'],
  },
  images: [{
    type: String,
  }],
  visitDate: {
    type: Date,
  },
  helpful: {
    type: Number,
    default: 0,
    min: 0,
  },
  helpfulBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      delete ret.__v;
      return ret;
    },
  },
});

// Index for fetching reviews for a destination (newest first)
ReviewSchema.index({ destinationId: 1, createdAt: -1 });

// Index for finding reviews by a user
ReviewSchema.index({ userId: 1 });

// Ensure one review per user per destination
ReviewSchema.index({ userId: 1, destinationId: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);
