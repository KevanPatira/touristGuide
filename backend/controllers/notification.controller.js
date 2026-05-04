// controllers/notification.controller.js — Notification management
const Notification = require('../models/Notification');

/**
 * Get notifications for the current user (paginated)
 * GET /api/notifications?page=1&limit=30
 */
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ recipientId: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('fromUserId', 'name username avatar')
        .lean(),
      Notification.countDocuments({ recipientId: req.user.id }),
      Notification.countDocuments({ recipientId: req.user.id, read: false }),
    ]);

    const mapped = notifications.map(n => ({
      ...n,
      id: n._id,
      fromUserName: n.fromUserId?.name || 'Unknown',
      fromUserAvatar: n.fromUserId?.avatar || '',
      fromUserUsername: n.fromUserId?.username || '',
    }));

    res.json({
      success: true,
      data: mapped,
      unreadCount,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipientId: req.user.id, read: false });
    res.json({ success: true, unreadCount: count });
  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({ success: false, message: 'Failed to get unread count' });
  }
};

/**
 * Mark a single notification as read
 * PUT /api/notifications/:id/read
 */
exports.markAsRead = async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user.id },
      { read: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
};

/**
 * Mark all notifications as read
 * PUT /api/notifications/read-all
 */
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientId: req.user.id, read: false },
      { read: true }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark all as read' });
  }
};
