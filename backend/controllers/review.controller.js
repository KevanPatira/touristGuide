// controllers/review.controller.js — Review CRUD and voting
const { validationResult } = require('express-validator');
const Review = require('../models/Review');
const Destination = require('../models/Destination');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Recalculate and update the average rating and review count for a destination.
 * @param {string} destinationId - Destination's MongoDB _id
 */
const updateDestinationRating = async (destinationId) => {
  const result = await Review.aggregate([
    { $match: { destinationId: destinationId } },
    {
      $group: {
        _id: '$destinationId',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  if (result.length > 0) {
    await Destination.findByIdAndUpdate(destinationId, {
      averageRating: Math.round(result[0].averageRating * 10) / 10,
      reviewCount: result[0].reviewCount,
    });
  } else {
    await Destination.findByIdAndUpdate(destinationId, {
      averageRating: 0,
      reviewCount: 0,
    });
  }
};

/**
 * @desc    Get all reviews for a destination (paginated)
 * @route   GET /api/reviews/destination/:id?page=1&limit=10
 * @access  Public
 */
const getReviewsForDestination = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  const skip = (page - 1) * limit;

  // Sort options
  let sort = { createdAt: -1 };
  if (req.query.sort === 'helpful') sort = { helpful: -1 };
  if (req.query.sort === 'rating_high') sort = { rating: -1 };
  if (req.query.sort === 'rating_low') sort = { rating: 1 };

  const [reviews, total] = await Promise.all([
    Review.find({ destinationId: req.params.id })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name avatar')
      .lean(),
    Review.countDocuments({ destinationId: req.params.id }),
  ]);

  res.status(200).json({
    success: true,
    data: reviews,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  });
});

/**
 * @desc    Create a review for a destination
 * @route   POST /api/reviews/destination/:id
 * @access  Private
 */
const createReview = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const destinationId = req.params.id;

  // Check destination exists
  const destination = await Destination.findById(destinationId);
  if (!destination) {
    return res.status(404).json({
      success: false,
      message: 'Destination not found',
    });
  }

  // Check if user already reviewed this destination
  const existingReview = await Review.findOne({
    userId: req.user.id,
    destinationId,
  });
  if (existingReview) {
    return res.status(400).json({
      success: false,
      message: 'You have already reviewed this destination. Use PATCH to update.',
    });
  }

  const { rating, title, body, images, visitDate } = req.body;

  const review = await Review.create({
    userId: req.user.id,
    destinationId,
    rating,
    title,
    body,
    images: images || [],
    visitDate: visitDate || null,
  });

  // Update destination's average rating
  await updateDestinationRating(destination._id);

  // Populate user info for response
  const populatedReview = await Review.findById(review._id)
    .populate('userId', 'name avatar')
    .lean();

  res.status(201).json({
    success: true,
    data: populatedReview,
  });
});

/**
 * @desc    Edit own review
 * @route   PATCH /api/reviews/:id
 * @access  Private
 */
const updateReview = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found',
    });
  }

  // Only the author can edit
  if (review.userId.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to edit this review',
    });
  }

  // Update allowed fields
  const allowedFields = ['rating', 'title', 'body', 'images', 'visitDate'];
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      review[field] = req.body[field];
    }
  }

  await review.save();

  // Recalculate destination rating
  await updateDestinationRating(review.destinationId);

  const populatedReview = await Review.findById(review._id)
    .populate('userId', 'name avatar')
    .lean();

  res.status(200).json({
    success: true,
    data: populatedReview,
  });
});

/**
 * @desc    Delete own review
 * @route   DELETE /api/reviews/:id
 * @access  Private
 */
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found',
    });
  }

  // Only the author can delete
  if (review.userId.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this review',
    });
  }

  const destinationId = review.destinationId;
  await Review.findByIdAndDelete(req.params.id);

  // Recalculate destination rating
  await updateDestinationRating(destinationId);

  res.status(200).json({
    success: true,
    message: 'Review deleted',
  });
});

/**
 * @desc    Upvote a review as helpful
 * @route   POST /api/reviews/:id/helpful
 * @access  Private
 */
const markHelpful = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found',
    });
  }

  // Check if user already voted
  if (review.helpfulBy && review.helpfulBy.includes(req.user.id)) {
    return res.status(400).json({
      success: false,
      message: 'You have already marked this review as helpful',
    });
  }

  // Cannot upvote own review
  if (review.userId.toString() === req.user.id) {
    return res.status(400).json({
      success: false,
      message: 'You cannot upvote your own review',
    });
  }

  review.helpful += 1;
  review.helpfulBy = review.helpfulBy || [];
  review.helpfulBy.push(req.user.id);
  await review.save();

  res.status(200).json({
    success: true,
    data: { helpful: review.helpful },
  });
});

module.exports = {
  getReviewsForDestination,
  createReview,
  updateReview,
  deleteReview,
  markHelpful,
};
