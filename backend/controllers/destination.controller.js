// controllers/destination.controller.js — Destination CRUD and queries
const { validationResult } = require('express-validator');
const Destination = require('../models/Destination');
const Review = require('../models/Review');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    List all destinations with optional filters
 * @route   GET /api/destinations?category=beach&country=India&state=Goa&page=1&limit=20
 * @access  Public
 */
const getDestinations = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  // Build filter
  const filter = {};
  if (req.query.category) filter.category = req.query.category.toLowerCase();
  if (req.query.country) filter.country = new RegExp(req.query.country, 'i');
  if (req.query.state) filter.state = new RegExp(req.query.state, 'i');
  if (req.query.featured) filter.featured = req.query.featured === 'true';

  // Build sort
  let sort = { createdAt: -1 };
  if (req.query.sort === 'rating') sort = { averageRating: -1 };
  if (req.query.sort === 'name') sort = { name: 1 };
  if (req.query.sort === 'rank') sort = { rank: 1 };

  const [destinations, total] = await Promise.all([
    Destination.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Destination.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: destinations,
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
 * @desc    Get featured destinations
 * @route   GET /api/destinations/featured
 * @access  Public
 */
const getFeatured = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 30);

  const destinations = await Destination.find({ featured: true })
    .sort({ averageRating: -1 })
    .limit(limit)
    .lean();

  res.status(200).json({
    success: true,
    data: destinations,
    count: destinations.length,
  });
});

/**
 * @desc    Find nearby destinations using geospatial query
 * @route   GET /api/destinations/nearby?lat=12.97&lng=77.59&radius=50
 * @access  Public
 */
const getNearby = asyncHandler(async (req, res) => {
  const { lat, lng, radius } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({
      success: false,
      message: 'Please provide lat and lng query parameters',
    });
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  const radiusKm = parseFloat(radius) || 50; // Default 50km
  const radiusInMeters = radiusKm * 1000;

  const destinations = await Destination.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        $maxDistance: radiusInMeters,
      },
    },
  })
    .limit(30)
    .lean();

  res.status(200).json({
    success: true,
    data: destinations,
    count: destinations.length,
    query: { lat: latitude, lng: longitude, radiusKm },
  });
});

/**
 * @desc    Text search destinations by name, country, city, state, or tags
 * @route   GET /api/destinations/search?q=taj+mahal
 * @access  Public
 */
const searchDestinations = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);

  if (!q || q.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a search query (q)',
    });
  }

  // Use text index search
  let destinations = await Destination.find(
    { $text: { $search: q } },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .lean();

  // Fallback to regex if text search returns nothing
  if (destinations.length === 0) {
    const regex = new RegExp(q, 'i');
    destinations = await Destination.find({
      $or: [
        { name: regex },
        { country: regex },
        { city: regex },
        { state: regex },
        { tags: regex },
      ],
    })
      .limit(limit)
      .lean();
  }

  res.status(200).json({
    success: true,
    data: destinations,
    count: destinations.length,
    query: q,
  });
});

/**
 * @desc    Get a single destination by ID with latest reviews
 * @route   GET /api/destinations/:id
 * @access  Public
 */
const getDestination = asyncHandler(async (req, res) => {
  const destination = await Destination.findById(req.params.id).lean();

  if (!destination) {
    return res.status(404).json({
      success: false,
      message: 'Destination not found',
    });
  }

  // Fetch latest 10 reviews for this destination
  const reviews = await Review.find({ destinationId: req.params.id })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('userId', 'name avatar')
    .lean();

  res.status(200).json({
    success: true,
    data: {
      ...destination,
      reviews,
    },
  });
});

/**
 * @desc    Create a new destination (admin)
 * @route   POST /api/destinations
 * @access  Private
 */
const createDestination = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const destination = await Destination.create(req.body);

  res.status(201).json({
    success: true,
    data: destination,
  });
});

module.exports = {
  getDestinations,
  getFeatured,
  getNearby,
  searchDestinations,
  getDestination,
  createDestination,
};
