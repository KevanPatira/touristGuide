// models/TranslationHistory.js — Stores user translation history
const mongoose = require('mongoose');

const TranslationHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  imageUrl: {
    type: String,
    default: null,
  },
  extractedText: {
    type: String,
    required: [true, 'Extracted text is required'],
  },
  translatedText: {
    type: String,
    required: [true, 'Translated text is required'],
  },
  sourceLanguage: {
    type: String,
    required: [true, 'Source language is required'],
  },
  targetLanguage: {
    type: String,
    required: [true, 'Target language is required'],
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      delete ret.__v;
      return ret;
    },
  },
});

// Compound index for fast user history queries sorted by newest first
TranslationHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('TranslationHistory', TranslationHistorySchema);
