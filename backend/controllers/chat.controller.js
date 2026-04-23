// controllers/chat.controller.js — Chat + Messages (MongoDB source of truth)
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');

/**
 * Create or get an existing DM chat
 * POST /api/chats
 * Body: { participantId }
 */
exports.createOrGetChat = async (req, res) => {
  try {
    const { participantId } = req.body;
    if (!participantId) {
      return res.status(400).json({ success: false, message: 'participantId is required' });
    }
    if (participantId === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot create chat with yourself' });
    }

    const otherUser = await User.findById(participantId).select('name username avatar');
    if (!otherUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check for existing DM between the two users
    const participants = [req.user.id, participantId].sort();
    let chat = await Chat.findOne({
      participants: { $all: participants, $size: 2 },
      chatType: 'dm',
    });

    if (!chat) {
      chat = await Chat.create({
        participants,
        chatType: 'dm',
      });
    }

    res.json({
      success: true,
      data: {
        chatId: chat._id,
        ...chat.toObject(),
        otherUser: {
          uid: otherUser._id,
          displayName: otherUser.name,
          username: otherUser.username,
          avatarUrl: otherUser.avatar || '',
        },
      },
    });
  } catch (error) {
    console.error('Create/get chat error:', error);
    res.status(500).json({ success: false, message: 'Failed to create/get chat' });
  }
};

/**
 * Get all chats for the current user
 * GET /api/chats
 */
exports.getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user.id })
      .sort({ lastMessageAt: -1 })
      .populate('participants', 'name username avatar')
      .lean();

    const mapped = chats.map(chat => {
      const otherUser = chat.participants.find(p => p._id.toString() !== req.user.id);
      const unreadCount = chat.unreadCounts?.get?.(req.user.id) || chat.unreadCounts?.[req.user.id] || 0;

      return {
        id: chat._id,
        chatType: chat.chatType,
        lastMessage: chat.lastMessage,
        lastMessageAt: chat.lastMessageAt,
        unreadCount,
        otherUserId: otherUser?._id,
        otherUserName: otherUser?.name || 'Unknown',
        otherUserAvatar: otherUser?.avatar || '',
        otherUsername: otherUser?.username || '',
      };
    });

    res.json({ success: true, data: mapped });
  } catch (error) {
    console.error('Get user chats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch chats' });
  }
};

/**
 * Send a message (stored in MongoDB — source of truth)
 * POST /api/chats/:chatId/messages
 * Body: { text }
 * Returns the message with its backend-generated _id
 */
exports.sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

    // Verify user is a participant
    if (!chat.participants.map(String).includes(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not a participant in this chat' });
    }

    // Create message with backend-generated ID (prevents duplicates)
    const message = await Message.create({
      chatId: chat._id,
      senderId: req.user.id,
      text: text.trim(),
      readBy: [req.user.id],
    });

    // Update chat metadata + increment unread for other participants
    const unreadUpdates = {};
    chat.participants.forEach(pid => {
      if (pid.toString() !== req.user.id) {
        unreadUpdates[`unreadCounts.${pid}`] = 1;
      }
    });

    await Chat.findByIdAndUpdate(chat._id, {
      lastMessage: text.trim().substring(0, 100),
      lastMessageAt: new Date(),
      $inc: unreadUpdates,
    });

    res.status(201).json({
      success: true,
      data: {
        id: message._id,
        messageId: message._id, // Explicit for frontend deduplication
        chatId: message.chatId,
        senderId: message.senderId,
        text: message.text,
        readBy: message.readBy,
        createdAt: message.createdAt,
      },
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

/**
 * Get messages for a chat (paginated, newest first)
 * GET /api/chats/:chatId/messages?page=1&limit=50
 */
exports.getMessages = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });
    if (!chat.participants.map(String).includes(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not a participant' });
    }

    const [messages, total] = await Promise.all([
      Message.find({ chatId: req.params.chatId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Message.countDocuments({ chatId: req.params.chatId }),
    ]);

    res.json({
      success: true,
      data: messages.map(m => ({ ...m, id: m._id })),
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
};

/**
 * Mark messages as read (reset unread count)
 * PUT /api/chats/:chatId/read
 */
exports.markChatAsRead = async (req, res) => {
  try {
    await Chat.findByIdAndUpdate(req.params.chatId, {
      [`unreadCounts.${req.user.id}`]: 0,
    });

    // Mark all messages in chat as read by this user
    await Message.updateMany(
      { chatId: req.params.chatId, readBy: { $ne: req.user.id } },
      { $addToSet: { readBy: req.user.id } }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Mark chat as read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark as read' });
  }
};

/**
 * Search users to start new chats
 * GET /api/chats/search-users?q=searchTerm
 */
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const regex = new RegExp(q, 'i');
    const users = await User.find({
      _id: { $ne: req.user.id },
      $or: [
        { name: regex },
        { username: regex },
        { email: regex },
      ],
    })
      .select('name username avatar bio')
      .limit(15)
      .lean();

    const mapped = users.map(u => ({
      uid: u._id,
      displayName: u.name,
      username: u.username || '',
      avatarUrl: u.avatar || '',
      bio: u.bio || '',
    }));

    res.json({ success: true, data: mapped });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ success: false, message: 'Failed to search users' });
  }
};
