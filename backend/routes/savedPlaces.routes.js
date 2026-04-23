// routes/savedPlaces.routes.js — Saved places routes
const express = require('express');
const { body } = require('express-validator');
const {
  getSavedPlaces,
  savePlace,
  unsavePlace,
  updateNote,
} = require('../controllers/savedPlaces.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// All saved places routes require authentication
router.use(protect);

// GET /api/saved — Get all saved places
router.get('/', getSavedPlaces);

// POST /api/saved/:destinationId — Save a place
router.post(
  '/:destinationId',
  [
    body('note')
      .optional()
      .isLength({ max: 500 }).withMessage('Note cannot exceed 500 characters'),
  ],
  savePlace
);

// DELETE /api/saved/:destinationId — Unsave a place
router.delete('/:destinationId', unsavePlace);

// PATCH /api/saved/:destinationId — Update note
router.patch(
  '/:destinationId',
  [
    body('note')
      .isString().withMessage('Note must be a string')
      .isLength({ max: 500 }).withMessage('Note cannot exceed 500 characters'),
  ],
  updateNote
);

module.exports = router;
