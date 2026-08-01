const CredentialingRecord = require('../models/CredentialingRecord.model');
const Provider = require('../models/Provider.model');
const AuditLog = require('../models/AuditLog.model');

const logAudit = (req, action, resourceId, metadata) =>
  AuditLog.create({
    userId: req.user._id,
    action,
    resourceType: 'CredentialingRecord',
    resourceId,
    metadata,
    ipAddress: req.ip,
  }).catch((err) => console.error('Audit log failed:', err.message));

// GET /api/credentialing
// Query params: providerId, practiceId (resolves to that practice's providers), status, payerName, page, limit
const listRecords = async (req, res) => {
  const { providerId, practiceId, status, payerName } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 200);

  const filter = {};
  if (providerId) {
    filter.providerId = providerId;
  } else if (practiceId) {
    const providerIds = await Provider.find({ practiceId }).distinct('_id');
    filter.providerId = { $in: providerIds };
  }
  if (status) filter.status = status;
  if (payerName && payerName.trim()) {
    filter.payerName = { $regex: payerName.trim(), $options: 'i' };
  }

  const [records, total] = await Promise.all([
    CredentialingRecord.find(filter)
      .populate({ path: 'providerId', select: 'name npi practiceId', populate: { path: 'practiceId', select: 'groupName' } })
      .populate('assignedTo', 'name email')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    CredentialingRecord.countDocuments(filter),
  ]);

  res.json({ records, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
};

// GET /api/credentialing/:id
const getRecord = async (req, res) => {
  const record = await CredentialingRecord.findById(req.params.id)
    .populate({ path: 'providerId', select: 'name npi practiceId', populate: { path: 'practiceId', select: 'groupName' } })
    .populate('assignedTo', 'name email');
  if (!record) {
    return res.status(404).json({ error: 'Credentialing record not found' });
  }
  res.json({ record });
};

// POST /api/credentialing
const createRecord = async (req, res) => {
  try {
    const record = await CredentialingRecord.create(req.body);
    await logAudit(req, 'create', record._id, { payerName: record.payerName, providerId: record.providerId });
    const populated = await record.populate([
      { path: 'providerId', select: 'name npi practiceId', populate: { path: 'practiceId', select: 'groupName' } },
      { path: 'assignedTo', select: 'name email' },
    ]);
    res.status(201).json({ record: populated });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'This provider already has a credentialing record for that payer.' });
    }
    throw err;
  }
};

// PATCH /api/credentialing/:id
const updateRecord = async (req, res) => {
  const record = await CredentialingRecord.findById(req.params.id);
  if (!record) {
    return res.status(404).json({ error: 'Credentialing record not found' });
  }

  const changedFields = Object.keys(req.body);
  const previousStatus = record.status;
  Object.assign(record, req.body);
  await record.save();

  await logAudit(req, 'update', record._id, {
    changedFields,
    ...(req.body.status && req.body.status !== previousStatus ? { statusFrom: previousStatus, statusTo: req.body.status } : {}),
  });

  const populated = await record.populate([
    { path: 'providerId', select: 'name npi practiceId', populate: { path: 'practiceId', select: 'groupName' } },
    { path: 'assignedTo', select: 'name email' },
  ]);
  res.json({ record: populated });
};

// DELETE /api/credentialing/:id — admin only (enforced in routes)
const deleteRecord = async (req, res) => {
  const record = await CredentialingRecord.findByIdAndDelete(req.params.id);
  if (!record) {
    return res.status(404).json({ error: 'Credentialing record not found' });
  }
  await logAudit(req, 'delete', record._id, { payerName: record.payerName });
  res.json({ message: 'Credentialing record deleted' });
};

module.exports = { listRecords, getRecord, createRecord, updateRecord, deleteRecord };
