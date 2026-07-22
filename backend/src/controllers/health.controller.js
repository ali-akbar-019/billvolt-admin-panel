const mongoose = require('mongoose');
const { getRedisClient } = require('../config/redis');

// GET /api/health
// Basic liveness + readiness check for the API.
// Used for uptime monitoring and to confirm deployment succeeded.
const getHealth = (req, res) => {
  const dbStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const redis = getRedisClient();

  res.status(200).json({
    status: 'ok',
    service: 'billvolt-backend',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: dbStateMap[mongoose.connection.readyState] || 'unknown',
    redis: redis ? redis.status : 'not_configured',
    environment: process.env.NODE_ENV || 'development',
  });
};

module.exports = { getHealth };
