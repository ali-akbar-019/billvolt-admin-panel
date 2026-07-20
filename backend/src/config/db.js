const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('[db] MONGODB_URI not set — skipping DB connection for now.');
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log('[db] MongoDB connected successfully.');
  } catch (err) {
    console.error('[db] MongoDB connection failed:', err.message);
    console.warn('[db] Continuing without a database connection. Set MONGODB_URI in .env once you have a cluster.');
  }
};

module.exports = connectDB;
