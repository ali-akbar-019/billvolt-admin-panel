const Practice = require('../models/Practice.model');
const AuditLog = require('../models/AuditLog.model');

const logAudit = (req, action, resourceId, metadata) =>
  AuditLog.create({
    userId: req.user._id,
    action,
    resourceType: 'Practice',
    resourceId,
    metadata,
    ipAddress: req.ip,
  }).catch((err) => console.error('Audit log failed:', err.message));

// GET /api/practices — search + filter + pagination
// Query params: q (text search), status, page (default 1), limit (default 20)
const listPractices = async (req, res) => {
  const { q, status } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

  const filter = {};
  if (status && ['active', 'inactive'].includes(status)) {
    filter.status = status;
  }
  if (q && q.trim()) {
    filter.$or = [
      { groupName: { $regex: q.trim(), $options: 'i' } },
      { dbaName: { $regex: q.trim(), $options: 'i' } },
      { groupNpi: { $regex: q.trim(), $options: 'i' } },
      { taxId: { $regex: q.trim(), $options: 'i' } },
    ];
  }

  const [practices, total] = await Promise.all([
    Practice.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Practice.countDocuments(filter),
  ]);

  res.json({
    practices,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
};

// GET /api/practices/:id
const getPractice = async (req, res) => {
  const practice = await Practice.findById(req.params.id).populate('providers', 'name npi specialty status');
  if (!practice) {
    return res.status(404).json({ error: 'Practice not found' });
  }
  res.json({ practice });
};

// POST /api/practices
const createPractice = async (req, res) => {
  const practice = await Practice.create({ ...req.body, createdBy: req.user._id });
  await logAudit(req, 'create', practice._id, { groupName: practice.groupName });
  res.status(201).json({ practice });
};

// PATCH /api/practices/:id
const updatePractice = async (req, res) => {
  const practice = await Practice.findById(req.params.id);
  if (!practice) {
    return res.status(404).json({ error: 'Practice not found' });
  }

  const changedFields = Object.keys(req.body);
  Object.assign(practice, req.body);
  await practice.save();

  await logAudit(req, 'update', practice._id, { changedFields });
  res.json({ practice });
};

// DELETE /api/practices/:id — admin only (enforced in routes)
const deletePractice = async (req, res) => {
  const practice = await Practice.findByIdAndDelete(req.params.id);
  if (!practice) {
    return res.status(404).json({ error: 'Practice not found' });
  }
  await logAudit(req, 'delete', practice._id, { groupName: practice.groupName });
  res.json({ message: 'Practice deleted' });
};

module.exports = { listPractices, getPractice, createPractice, updatePractice, deletePractice };
