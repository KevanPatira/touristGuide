// controllers/savedPlaces.controller.js — Saved/bookmarked places controller
const { validationResult } = require('express-validator');
const SavedPlace = require('../models/SavedPlace');
const Destination = require('../models/Destination');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get all saved places for the current user
 * @route   GET /api/saved
 * @access  Private
 */
const getSavedPlaces = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const skip = (page - 1) * limit;

  const [savedPlaces, total] = await Promise.all([
    SavedPlace.find({ userId: req.user.id })
      .sort({ savedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('destinationId', 'name country city state coverImage category averageRating')
      .lean(),
    SavedPlace.countDocuments({ userId: req.user.id }),
  ]);

  res.status(200).json({
    success: true,
    data: savedPlaces,
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
 * @desc    Save (bookmark) a destination
 * @route   POST /api/saved/:destinationId
 * @access  Private
 */
const savePlace = asyncHandler(async (req, res) => {
  const { destinationId } = req.params;

  // Check destination exists
  const destination = await Destination.findById(destinationId);
  if (!destination) {
    return res.status(404).json({
      success: false,
      message: 'Destination not found',
    });
  }

  // Check if already saved
  const existing = await SavedPlace.findOne({
    userId: req.user.id,
    destinationId,
  });
  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'Destination already saved',
    });
  }

  const savedPlace = await SavedPlace.create({
    userId: req.user.id,
    destinationId,
    note: req.body.note || '',
  });

  // Populate for response
  const populated = await SavedPlace.findById(savedPlace._id)
    .populate('destinationId', 'name country city state coverImage category averageRating')
    .lean();

  res.status(201).json({
    success: true,
    data: populated,
  });
});

/**
 * @desc    Unsave (remove bookmark) a destination
 * @route   DELETE /api/saved/:destinationId
 * @access  Private
 */
const unsavePlace = asyncHandler(async (req, res) => {
  const { destinationId } = req.params;

  const savedPlace = await SavedPlace.findOneAndDelete({
    userId: req.user.id,
    destinationId,
  });

  if (!savedPlace) {
    return res.status(404).json({
      success: false,
      message: 'Saved place not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Place removed from saved',
  });
});

/**
 * @desc    Update personal note on a saved place
 * @route   PATCH /api/saved/:destinationId
 * @access  Private
 */
const updateNote = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { destinationId } = req.params;
  const { note } = req.body;

  const savedPlace = await SavedPlace.findOneAndUpdate(
    { userId: req.user.id, destinationId },
    { note },
    { new: true, runValidators: true }
  )
    .populate('destinationId', 'name country city state coverImage category averageRating')
    .lean();

  if (!savedPlace) {
    return res.status(404).json({
      success: false,
      message: 'Saved place not found',
    });
  }

  res.status(200).json({
    success: true,
    data: savedPlace,
  });
});

module.exports = { getSavedPlaces, savePlace, unsavePlace, updateNote };
