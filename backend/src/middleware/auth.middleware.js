const { verifyAccessToken } = require('../utils/token.util');
const User = require('../models/User.model');

// Verifies the access token cookie and attaches req.user. 401 if missing/invalid.
const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.sub);

    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'Account not found or disabled' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
};

// Restricts a route to specific roles. Usage: authorize('admin')
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'You do not have permission to perform this action' });
  }
  next();
};

module.exports = { protect, authorize };
