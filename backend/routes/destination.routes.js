// routes/destination.routes.js — Destination routes
const express = require('express');
const { body } = require('express-validator');
const {
  getDestinations,
  getFeatured,
  getNearby,
  searchDestinations,
  getDestination,
  createDestination,
} = require('../controllers/destination.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
// GET /api/destinations — List all with filters
router.get('/', getDestinations);

// GET /api/destinations/featured — Get featured
router.get('/featured', getFeatured);

// GET /api/destinations/nearby — Geospatial query
router.get('/nearby', getNearby);

// GET /api/destinations/search — Text search
router.get('/search', searchDestinations);

// GET /api/destinations/:id — Single destination with reviews
router.get('/:id', getDestination);

// POST /api/destinations — Create (requires auth)
router.post(
  '/',
  protect,
  [
    body('name')
      .trim()
      .notEmpty().withMessage('Destination name is required'),
    body('country')
      .trim()
      .notEmpty().withMessage('Country is required'),
    body('category')
      .optional()
      .isIn(['beach', 'mountain', 'city', 'heritage', 'nature', 'adventure', 'food', 'religious', 'wildlife', 'temple'])
      .withMessage('Invalid category'),
  ],
  createDestination
);

module.exports = router;
