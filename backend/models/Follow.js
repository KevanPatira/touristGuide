// models/Follow.js — Follow relationship schema
const mongoose = require('mongoose');

const FollowSchema = new mongoose.Schema({
  followerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  followingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted'],
    default: 'accepted',
  },
}, {
  timestamps: true,
});

// Unique compound index — prevents duplicate follow entries
FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
// For querying followers/following lists
FollowSchema.index({ followingId: 1, status: 1 });
FollowSchema.index({ followerId: 1, status: 1 });

module.exports = mongoose.model('Follow', FollowSchema);
