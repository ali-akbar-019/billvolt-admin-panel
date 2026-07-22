const User = require('../models/User.model');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/token.util');
const { createSession, isSessionValid, revokeSession } = require('../utils/session.service');

const COOKIE_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, { ...COOKIE_BASE, maxAge: 15 * 60 * 1000 }); // 15 min
  res.cookie('refreshToken', refreshToken, { ...COOKIE_BASE, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days
};

const issueTokensForUser = async (res, user) => {
  const jti = await createSession(user._id.toString());
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user, jti);
  setAuthCookies(res, accessToken, refreshToken);
};

// POST /api/auth/register — admin-only, creates staff/admin accounts.
// There is no public self-signup: this is an internal tool, not a consumer app.
const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ error: 'An account with that email already exists' });
  }

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email, passwordHash, role: role || 'staff' });

  res.status(201).json({ user });
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || user.status !== 'active') {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const passwordMatches = await user.comparePassword(password);
  if (!passwordMatches) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  user.lastLoginAt = new Date();
  await user.save();

  await issueTokensForUser(res, user);
  res.json({ user });
};

// POST /api/auth/refresh — rotates the refresh token, issues a fresh access token
const refresh = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    return res.status(401).json({ error: 'No refresh token provided' });
  }

  try {
    const decoded = verifyRefreshToken(token);
    const sessionValid = await isSessionValid(decoded.sub, decoded.jti);

    if (!sessionValid) {
      return res.status(401).json({ error: 'Session has been revoked' });
    }

    const user = await User.findById(decoded.sub);
    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'Account not found or disabled' });
    }

    // Rotate: invalidate the old refresh token, issue a brand new pair
    await revokeSession(decoded.sub, decoded.jti);
    await issueTokensForUser(res, user);

    res.json({ user });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (token) {
    try {
      const decoded = verifyRefreshToken(token);
      await revokeSession(decoded.sub, decoded.jti);
    } catch (err) {
      // Token already invalid/expired — nothing to revoke, fall through to clearing cookies
    }
  }

  res.clearCookie('accessToken', COOKIE_BASE);
  res.clearCookie('refreshToken', COOKIE_BASE);
  res.json({ message: 'Logged out' });
};

// GET /api/auth/me
const me = async (req, res) => {
  res.json({ user: req.user });
};

module.exports = { register, login, refresh, logout, me };
