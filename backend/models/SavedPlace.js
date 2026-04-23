// models/SavedPlace.js — User's saved/bookmarked destinations
const mongoose = require('mongoose');

const SavedPlaceSchema = new mongoose.Schema({
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
  note: {
    type: String,
    default: '',
    maxlength: [500, 'Note cannot exceed 500 characters'],
  },
  savedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      delete ret.__v;
      return ret;
    },
  },
});

// Unique compound index: a user can save a destination only once
SavedPlaceSchema.index({ userId: 1, destinationId: 1 }, { unique: true });

// Index for fetching all saved places for a user
SavedPlaceSchema.index({ userId: 1, savedAt: -1 });

module.exports = mongoose.model('SavedPlace', SavedPlaceSchema);
