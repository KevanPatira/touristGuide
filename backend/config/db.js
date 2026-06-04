// config/db.js — Mongoose connection to MongoDB Atlas (or in-memory fallback)
const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas using the connection string from environment variables.
 * Falls back to an in-memory MongoDB server for development if no valid URI is provided.
 */
const connectDB = async () => {
  let uri = process.env.MONGODB_URI;
  const placeholders = ['your_uri_here', '', undefined];

  // If no real MongoDB URI, use in-memory server for development
  if (!uri || placeholders.includes(uri)) {
    console.warn('\n⚠️  No valid MONGODB_URI found. Starting in-memory MongoDB for development...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      console.log('✅ In-memory MongoDB started successfully');
      console.log('   ⚠️  Data will NOT persist after server restart');
      console.log('   → Set MONGODB_URI in backend/.env for persistent data\n');
    } catch (err) {
      console.error('❌ Failed to start in-memory MongoDB:', err.message);
      console.warn('   → Install mongodb-memory-server: npm install mongodb-memory-server');
      return;
    }
  }

  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    console.warn('⚠️  Server will continue running without database. API routes requiring DB will fail.');
    console.warn('   → Update MONGODB_URI in backend/.env with a valid connection string.');
  }
};

module.exports = connectDB;
