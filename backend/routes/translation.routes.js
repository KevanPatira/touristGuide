// routes/translation.routes.js — Translation history routes
const express = require('express');
const { body } = require('express-validator');
const {
  saveTranslation,
  getHistory,
  deleteTranslation,
  clearHistory,
} = require('../controllers/translation.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// All translation routes require authentication
router.use(protect);

// POST /api/translations — Save a new translation
router.post(
  '/',
  [
    body('extractedText')
      .notEmpty().withMessage('Extracted text is required'),
    body('translatedText')
      .notEmpty().withMessage('Translated text is required'),
    body('sourceLanguage')
      .notEmpty().withMessage('Source language is required'),
    body('targetLanguage')
      .notEmpty().withMessage('Target language is required'),
    body('imageUrl')
      .optional()
      .isString().withMessage('Image URL must be a string'),
  ],
  saveTranslation
);

// GET /api/translations — Get history (paginated)
router.get('/', getHistory);

// DELETE /api/translations — Clear all history
router.delete('/', clearHistory);

// DELETE /api/translations/:id — Delete single entry
router.delete('/:id', deleteTranslation);

module.exports = router;
