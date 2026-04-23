// routes/post.routes.js — Community post endpoints
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const postController = require('../controllers/post.controller');

// All routes require authentication
router.use(protect);

router.post('/', postController.createPost);
router.get('/', postController.getPosts);
router.post('/:id/like', postController.likePost);
router.post('/:id/unlike', postController.unlikePost);
router.delete('/:id', postController.deletePost);

module.exports = router;
