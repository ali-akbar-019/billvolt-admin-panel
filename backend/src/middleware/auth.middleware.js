const { verifyToken } = require('../utils/token.util');
const User = require('../models/User.model');

// Verifies the JWT cookie and attaches req.user. 401 if missing/invalid.
const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const decoded = verifyToken(token);
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

module.exports = { requireAuth };
