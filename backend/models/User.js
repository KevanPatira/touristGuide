// models/User.js — User schema for authentication and profile
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  passwordHash: {
    type: String,
    required: false, // Not required for Google OAuth users
    minlength: 6,
    select: false, // Never return in queries by default
  },
  googleId: {
    type: String,
    default: null,
    sparse: true,
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local',
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    maxlength: [50, 'Username cannot exceed 50 characters'],
  },
  avatar: {
    type: String,
    default: null,
  },
  preferredLanguage: {
    type: String,
    default: 'English',
  },
  homeCountry: {
    type: String,
    default: null,
  },
  bio: {
    type: String,
    default: '',
    maxlength: [500, 'Bio cannot exceed 500 characters'],
  },
  followerCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  followingCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  postCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  savedPlaces: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SavedPlace',
  }],
  lastLogin: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      delete ret.passwordHash;
      delete ret.__v;
      return ret;
    },
  },
});

// Note: email index is auto-created by `unique: true` in the schema field

/**
 * Hash password before saving
 */
UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash') || !this.passwordHash) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

/**
 * Compare entered password with stored hash
 * @param {string} candidatePassword - Password to verify
 * @returns {Promise<boolean>}
 */
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

module.exports = mongoose.model('User', UserSchema);
