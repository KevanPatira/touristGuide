// models/Notification.js — Notification schema
const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['new_follower', 'follow_request', 'follow_accepted', 'new_post', 'like', 'comment', 'new_message'],
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null,
  },
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    default: null,
  },
  read: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Indexes for efficient notification queries
NotificationSchema.index({ recipientId: 1, read: 1 });
NotificationSchema.index({ recipientId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
