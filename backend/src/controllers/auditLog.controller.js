const AuditLog = require('../models/AuditLog.model');

// GET /api/audit-logs
// Query params: action, resourceType, userId, from, to, page, limit
const listLogs = async (req, res) => {
  const { action, resourceType, userId, from, to } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 200);

  const filter = {};
  if (action) filter.action = action;
  if (resourceType) filter.resourceType = resourceType;
  if (userId) filter.userId = userId;

  const dateFilter = {};
  if (from && !Number.isNaN(Date.parse(from))) dateFilter.$gte = new Date(from);
  if (to && !Number.isNaN(Date.parse(to))) dateFilter.$lte = new Date(to);
  if (Object.keys(dateFilter).length) filter.createdAt = dateFilter;

  // Keep resourceId matching tolerant of ids that may not exist anymore.
  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    AuditLog.countDocuments(filter),
  ]);

  res.json({ logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
};

module.exports = { listLogs };