const Provider = require('../models/Provider.model');
const AuditLog = require('../models/AuditLog.model');

const logAudit = (req, action, resourceId, metadata) =>
  AuditLog.create({
    userId: req.user._id,
    action,
    resourceType: 'Provider',
    resourceId,
    metadata,
    ipAddress: req.ip,
  }).catch((err) => console.error('Audit log failed:', err.message));

// GET /api/providers — search + filter + pagination
// Query params: q, practiceId, status, specialty, page, limit
const listProviders = async (req, res) => {
  const { q, practiceId, status, specialty } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

  const filter = {};
  if (practiceId) filter.practiceId = practiceId;
  if (status && ['active', 'inactive'].includes(status)) filter.status = status;
  if (specialty) filter.specialty = { $regex: specialty.trim(), $options: 'i' };
  if (q && q.trim()) {
    filter.$or = [
      { name: { $regex: q.trim(), $options: 'i' } },
      { npi: { $regex: q.trim(), $options: 'i' } },
      { specialty: { $regex: q.trim(), $options: 'i' } },
    ];
  }

  const [providers, total] = await Promise.all([
    Provider.find(filter)
      .populate('practiceId', 'groupName')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Provider.countDocuments(filter),
  ]);

  res.json({
    providers,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
};

// GET /api/providers/:id
const getProvider = async (req, res) => {
  const provider = await Provider.findById(req.params.id).populate('practiceId', 'groupName status');
  if (!provider) {
    return res.status(404).json({ error: 'Provider not found' });
  }
  res.json({ provider });
};

// GET /api/providers/:id/sensitive — admin only, audited, decrypts SSN + CAQH creds
const getSensitiveFields = async (req, res) => {
  const provider = await Provider.findById(req.params.id).select('+ssn +caqh.username +caqh.password');
  if (!provider) {
    return res.status(404).json({ error: 'Provider not found' });
  }

  await logAudit(req, 'view_sensitive', provider._id, { fields: ['ssn', 'caqh.username', 'caqh.password'] });

  res.json({
    ssn: provider.ssn || null,
    caqh: {
      username: provider.caqh?.username || null,
      password: provider.caqh?.password || null,
    },
  });
};

// POST /api/providers
const createProvider = async (req, res) => {
  const provider = await Provider.create(req.body);
  await logAudit(req, 'create', provider._id, { name: provider.name, practiceId: provider.practiceId });
  const populated = await provider.populate('practiceId', 'groupName');
  res.status(201).json({ provider: populated });
};

// PATCH /api/providers/:id
const updateProvider = async (req, res) => {
  const provider = await Provider.findById(req.params.id);
  if (!provider) {
    return res.status(404).json({ error: 'Provider not found' });
  }

  const changedFields = Object.keys(req.body);
  Object.assign(provider, req.body);
  await provider.save();

  await logAudit(req, 'update', provider._id, { changedFields });
  const populated = await provider.populate('practiceId', 'groupName');
  res.json({ provider: populated });
};

// DELETE /api/providers/:id — admin only (enforced in routes)
const deleteProvider = async (req, res) => {
  const provider = await Provider.findByIdAndDelete(req.params.id);
  if (!provider) {
    return res.status(404).json({ error: 'Provider not found' });
  }
  await logAudit(req, 'delete', provider._id, { name: provider.name });
  res.json({ message: 'Provider deleted' });
};

module.exports = {
  listProviders,
  getProvider,
  getSensitiveFields,
  createProvider,
  updateProvider,
  deleteProvider,
};
