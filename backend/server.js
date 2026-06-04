// server.js — Express entry point for TouristGuide backend
// Load environment variables based on environment
require('dotenv').config();

// Use Google Public DNS to resolve MongoDB Atlas SRV records
// (some networks block SRV queries needed by mongodb+srv:// URIs)
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

// Validate essential environment variables (MONGODB_URI is optional — falls back to in-memory)
const requiredEnv = ['JWT_SECRET', 'OPENROUTER_API_KEY'];
const placeholders = ['your_jwt_secret_here', 'your_openrouter_api_key_here'];
const missing = requiredEnv.filter(key => !process.env[key]);
const stillPlaceholder = requiredEnv.filter(key => process.env[key] && placeholders.includes(process.env[key]));

if (missing.length > 0) {
  console.error(`❌ FATAL ERROR: Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

if (stillPlaceholder.length > 0) {
  console.warn(`\n⚠️  WARNING: The following env variables still have placeholder values: ${stillPlaceholder.join(', ')}`);
}
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/auth.routes');
const translationRoutes = require('./routes/translation.routes');
const destinationRoutes = require('./routes/destination.routes');
const reviewRoutes = require('./routes/review.routes');
const savedPlacesRoutes = require('./routes/savedPlaces.routes');
const aiRoutes = require('./routes/ai.routes');
const postRoutes = require('./routes/post.routes');
const commentRoutes = require('./routes/comment.routes');
const followRoutes = require('./routes/follow.routes');
const notificationRoutes = require('./routes/notification.routes');
const chatRoutes = require('./routes/chat.routes');
const mediaRoutes = require('./routes/media.routes');
const otpRoutes = require('./routes/otp.routes');

// ══════════════════════════════════════════════════════════
//  Initialize Express App
// ══════════════════════════════════════════════════════════

const app = express();

// ── Connect to MongoDB ──────────────────────────────────
connectDB();

// ══════════════════════════════════════════════════════════
//  Global Middleware
// ══════════════════════════════════════════════════════════

// Security headers
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:8081', 'http://localhost:19006'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Also allow any Expo dev client
    if (origin.startsWith('exp://') || origin.startsWith('http://192.168.') || origin.startsWith('http://10.')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Rate limiting
app.use(generalLimiter);

// ══════════════════════════════════════════════════════════
//  API Routes
// ══════════════════════════════════════════════════════════

app.use('/api/auth', authRoutes);
app.use('/api/translations', translationRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/saved', savedPlacesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/follows', followRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/otp', otpRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TouristGuide API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ══════════════════════════════════════════════════════════
//  Global Error Handler (must be last)
// ══════════════════════════════════════════════════════════

app.use(errorHandler);

// ══════════════════════════════════════════════════════════
//  Start Server
// ══════════════════════════════════════════════════════════

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`\n🚀 TouristGuide API running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`❌ Uncaught Exception: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;
