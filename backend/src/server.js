require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const { getRedisClient } = require('./config/redis');

const PORT = process.env.PORT || 5000;

const REQUIRED_IN_PRODUCTION = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'FIELD_ENCRYPTION_KEY', 'MONGODB_URI'];

const checkRequiredEnv = () => {
  const missing = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key]);
  if (missing.length && process.env.NODE_ENV === 'production') {
    console.error(`[server] Missing required env vars: ${missing.join(', ')}`);
    process.exit(1);
  }
  if (missing.length) {
    console.warn(`[server] Missing env vars (fine for local dev, required in production): ${missing.join(', ')}`);
  }
};

const start = async () => {
  checkRequiredEnv();
  await connectDB();
  getRedisClient(); // connects lazily; logs its own status

  app.listen(PORT, () => {
    console.log(`[server] BillVolt backend running on port ${PORT}`);
  });
};

start();
