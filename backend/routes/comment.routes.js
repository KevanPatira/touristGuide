// routes/comment.routes.js — Comment endpoints
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const commentController = require('../controllers/comment.controller');

router.use(protect);

router.post('/:postId', commentController.addComment);
router.get('/:postId', commentController.getComments);
router.delete('/:id', commentController.deleteComment);

module.exports = router;
