// routes/review.routes.js — Review routes
const express = require('express');
const { body } = require('express-validator');
const {
  getReviewsForDestination,
  createReview,
  updateReview,
  deleteReview,
  markHelpful,
} = require('../controllers/review.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// GET /api/reviews/destination/:id — Public: all reviews for a destination
router.get('/destination/:id', getReviewsForDestination);

// POST /api/reviews/destination/:id — Create review (auth required)
router.post(
  '/destination/:id',
  protect,
  [
    body('rating')
      .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('title')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
    body('body')
      .optional()
      .isLength({ max: 2000 }).withMessage('Review body cannot exceed 2000 characters'),
    body('images')
      .optional()
      .isArray().withMessage('Images must be an array'),
    body('visitDate')
      .optional()
      .isISO8601().withMessage('Visit date must be a valid date'),
  ],
  createReview
);

// PATCH /api/reviews/:id — Edit own review (auth required)
router.patch(
  '/:id',
  protect,
  [
    body('rating')
      .optional()
      .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('title')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
    body('body')
      .optional()
      .isLength({ max: 2000 }).withMessage('Review body cannot exceed 2000 characters'),
  ],
  updateReview
);

// DELETE /api/reviews/:id — Delete own review (auth required)
router.delete('/:id', protect, deleteReview);

// POST /api/reviews/:id/helpful — Upvote a review (auth required)
router.post('/:id/helpful', protect, markHelpful);

module.exports = router;
