const Redis = require('ioredis');

let client = null;

const getRedisClient = () => {
  if (client) return client;

  const url = process.env.REDIS_URL;

  if (!url) {
    console.warn('[redis] REDIS_URL not set — sessions, rate limiting, and caching are disabled.');
    return null;
  }

  client = new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 200, 2000),
  });

  client.on('connect', () => console.log('[redis] Connected successfully.'));
  client.on('error', (err) => console.error('[redis] Connection error:', err.message));

  return client;
};

module.exports = { getRedisClient };
