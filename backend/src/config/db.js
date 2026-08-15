const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    const message = '[db] MONGODB_URI is not set.';

    if (process.env.NODE_ENV === 'production') {
      throw new Error(message);
    }

    console.warn(`${message} Skipping DB connection in development.`);
    return;
  }

  try {
    if (mongoose.connection.readyState === 1) {
      console.log('[db] MongoDB already connected.');
      return;
    }

    await mongoose.connect(uri);

    console.log('[db] MongoDB connected successfully.');
  } catch (err) {
    console.error('[db] MongoDB connection failed:', err.message);

    throw err;
  }
};

module.exports = connectDB;