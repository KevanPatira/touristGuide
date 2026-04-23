// routes/chat.routes.js — Chat + message endpoints
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const chatController = require('../controllers/chat.controller');

router.use(protect);

// User search (must be before /:chatId routes)
router.get('/search-users', chatController.searchUsers);

// Chat CRUD
router.post('/', chatController.createOrGetChat);
router.get('/', chatController.getUserChats);

// Messages within a chat
router.post('/:chatId/messages', chatController.sendMessage);
router.get('/:chatId/messages', chatController.getMessages);
router.put('/:chatId/read', chatController.markChatAsRead);

module.exports = router;
