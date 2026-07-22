const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

const signAccessToken = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });

const signRefreshToken = (user, tokenId) =>
  jwt.sign({ sub: user._id.toString(), jti: tokenId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_TTL_SECONDS,
  });

const verifyAccessToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

const verifyRefreshToken = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  REFRESH_TOKEN_TTL_SECONDS,
};
