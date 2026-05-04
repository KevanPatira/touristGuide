// controllers/translation.controller.js — Translation history controller
const { validationResult } = require('express-validator');
const TranslationHistory = require('../models/TranslationHistory');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Save a new translation to user's history
 * @route   POST /api/translations
 * @access  Private
 */
const saveTranslation = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { imageUrl, extractedText, translatedText, sourceLanguage, targetLanguage } = req.body;

  const translation = await TranslationHistory.create({
    userId: req.user.id,
    imageUrl: imageUrl || null,
    extractedText,
    translatedText,
    sourceLanguage,
    targetLanguage,
  });

  res.status(201).json({
    success: true,
    data: translation,
  });
});

/**
 * @desc    Get user's translation history (paginated, newest first)
 * @route   GET /api/translations?page=1&limit=20
 * @access  Private
 */
const getHistory = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 50); // Cap at 50
  const skip = (page - 1) * limit;

  const [translations, total] = await Promise.all([
    TranslationHistory.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    TranslationHistory.countDocuments({ userId: req.user.id }),
  ]);

  res.status(200).json({
    success: true,
    data: translations,
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
 * @desc    Delete a single translation history entry
 * @route   DELETE /api/translations/:id
 * @access  Private
 */
const deleteTranslation = asyncHandler(async (req, res) => {
  const translation = await TranslationHistory.findById(req.params.id);

  if (!translation) {
    return res.status(404).json({
      success: false,
      message: 'Translation not found',
    });
  }

  // Ensure user owns this translation
  if (translation.userId.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this translation',
    });
  }

  await TranslationHistory.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Translation deleted',
  });
});

/**
 * @desc    Clear all translation history for the current user
 * @route   DELETE /api/translations
 * @access  Private
 */
const clearHistory = asyncHandler(async (req, res) => {
  const result = await TranslationHistory.deleteMany({ userId: req.user.id });

  res.status(200).json({
    success: true,
    message: `Cleared ${result.deletedCount} translation(s) from history`,
    deletedCount: result.deletedCount,
  });
});

module.exports = { saveTranslation, getHistory, deleteTranslation, clearHistory };
