// models/Destination.js — Tourist destination schema with geospatial support
const mongoose = require('mongoose');

const DestinationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Destination name is required'],
    trim: true,
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true,
  },
  city: {
    type: String,
    trim: true,
  },
  state: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  coverImage: {
    type: String,
    default: null,
  },
  images: [{
    type: String,
  }],
  category: {
    type: String,
    enum: ['beach', 'mountain', 'city', 'heritage', 'nature', 'adventure',
           'food', 'religious', 'wildlife', 'temple'],
    default: 'city',
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0],
    },
  },
  tags: [{
    type: String,
    lowercase: true,
    trim: true,
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  languages: [{
    type: String,
  }],
  transport: {
    type: String,
    default: '',
  },
  rank: {
    type: Number,
    default: 0,
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

// Geospatial index for nearby queries
DestinationSchema.index({ location: '2dsphere' });

// Text index for search functionality
DestinationSchema.index({ name: 'text', country: 'text', city: 'text', state: 'text', tags: 'text' });

// Index for category filtering
DestinationSchema.index({ category: 1 });
DestinationSchema.index({ featured: 1 });
DestinationSchema.index({ country: 1, state: 1 });

module.exports = mongoose.model('Destination', DestinationSchema);
