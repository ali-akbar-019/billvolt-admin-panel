const crypto = require('crypto');
const { getRedisClient } = require('../config/redis');
const { REFRESH_TOKEN_TTL_SECONDS } = require('../utils/token.util');

const sessionKey = (userId, jti) => `session:${userId}:${jti}`;

// Registers a new refresh token session. Returns the token's unique id (jti).
const createSession = async (userId) => {
  const jti = crypto.randomUUID();
  const redis = getRedisClient();

  if (redis) {
    await redis.set(sessionKey(userId, jti), '1', 'EX', REFRESH_TOKEN_TTL_SECONDS);
  }
  // If Redis is unavailable, the session isn't tracked — refresh tokens
  // remain valid until natural expiry but can't be revoked early.

  return jti;
};

// Checks whether a refresh token's session is still valid (not revoked/logged out).
const isSessionValid = async (userId, jti) => {
  const redis = getRedisClient();
  if (!redis) return true; // fail open only when Redis isn't configured at all

  const exists = await redis.get(sessionKey(userId, jti));
  return exists !== null;
};

// Revokes a single session (used on refresh-token rotation and logout).
const revokeSession = async (userId, jti) => {
  const redis = getRedisClient();
  if (!redis) return;
  await redis.del(sessionKey(userId, jti));
};

// Revokes every session for a user (used for "log out everywhere" / admin-disables-user).
const revokeAllSessions = async (userId) => {
  const redis = getRedisClient();
  if (!redis) return;

  const keys = await redis.keys(`session:${userId}:*`);
  if (keys.length) await redis.del(...keys);
};

module.exports = { createSession, isSessionValid, revokeSession, revokeAllSessions };
