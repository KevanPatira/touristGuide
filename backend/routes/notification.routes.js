// routes/notification.routes.js — Notification endpoints
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const notifController = require('../controllers/notification.controller');

router.use(protect);

router.get('/', notifController.getNotifications);
router.get('/unread-count', notifController.getUnreadCount);
router.put('/read-all', notifController.markAllAsRead);
router.put('/:id/read', notifController.markAsRead);

module.exports = router;
