// routes/follow.routes.js — Follow/unfollow endpoints
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const followController = require('../controllers/follow.controller');

router.use(protect);

router.post('/:userId', followController.followUser);
router.delete('/:userId', followController.unfollowUser);
router.put('/:userId/accept', followController.acceptFollow);
router.delete('/:userId/decline', followController.declineFollow);
router.get('/status/:userId', followController.checkFollowStatus);
router.get('/followers/:userId', followController.getFollowers);
router.get('/following/:userId', followController.getFollowing);

module.exports = router;
