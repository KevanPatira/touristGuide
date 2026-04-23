// models/Chat.js — Chat metadata schema
const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  chatType: {
    type: String,
    enum: ['dm', 'group'],
    default: 'dm',
  },
  lastMessage: {
    type: String,
    default: '',
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
  // Per-user unread counts: { "userId": count }
  unreadCounts: {
    type: Map,
    of: Number,
    default: {},
  },
}, {
  timestamps: true,
});

// Index for querying user's chats sorted by last activity
ChatSchema.index({ participants: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Chat', ChatSchema);
