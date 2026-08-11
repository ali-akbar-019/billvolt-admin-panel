const CredentialingRecord = require('../models/CredentialingRecord.model');
const Provider = require('../models/Provider.model');
const FollowUp = require('../models/FollowUp.model');
const AuditLog = require('../models/AuditLog.model');
const { notifyForFollowUps } = require('./followup.controller');
const { visiblePracticeIds, canAccessProvider, canAccessRecord } = require('../utils/scope.util');

const logAudit = (req, action, resourceId, metadata) =>
  AuditLog.create({
    userId: req.user._id,
    action,
    resourceType: 'CredentialingRecord',
    resourceId,
    metadata,
    ipAddress: req.ip,
  }).catch((err) => console.error('Audit log failed:', err.message));

// Keeps the FollowUp task in sync with a record's nextFollowUpDate:
//  - date set/changed -> create the task, or push its due date
//  - date cleared     -> remove the still-pending task (a completed one is left alone)
const syncFollowUp = async (record, req) => {
  if (!('nextFollowUpDate' in req.body)) return;

  const existing = await FollowUp.findOne({
    linkedType: 'CredentialingRecord',
    linkedId: record._id,
    status: 'pending',
  });

  if (!record.nextFollowUpDate) {
    if (existing) await FollowUp.findByIdAndDelete(existing._id);
    return;
  }

  if (existing) {
    existing.dueDate = record.nextFollowUpDate;
    await existing.save();
    return;
  }

  const provider = await Provider.findById(record.providerId).select('name');
  const followUp = await FollowUp.create({
    title: `Follow up: ${record.payerName}${provider ? ` — ${provider.name}` : ''}`,
    linkedType: 'CredentialingRecord',
    linkedId: record._id,
    dueDate: record.nextFollowUpDate,
    assignedTo: record.assignedTo || req.user._id,
  });
  const populated = await followUp.populate('assignedTo', 'name email');
  notifyForFollowUps([populated]);
};

// GET /api/credentialing
// Query params: providerId, practiceId (resolves to that practice's providers), status, payerName, page, limit
const listRecords = async (req, res) => {
  const { providerId, practiceId, status, payerName } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 200);

  const filter = {};
  const visiblePracticeIdsForStaff = visiblePracticeIds(req.user);

  // Staff only ever see records whose provider belongs to an assigned practice.
  // Resolve that provider set once and constrain every other query param to it.
  const scopedProviderIds =
    visiblePracticeIdsForStaff === null
      ? null
      : await Provider.find({ practiceId: { $in: visiblePracticeIdsForStaff } }).distinct('_id');

  if (providerId) {
    if (scopedProviderIds !== null && !scopedProviderIds.some((id) => id.toString() === providerId)) {
      return res.status(403).json({ error: 'You do not have access to this provider' });
    }
    filter.providerId = providerId;
  } else if (practiceId) {
    if (visiblePracticeIdsForStaff !== null && !visiblePracticeIdsForStaff.some((id) => id.toString() === practiceId)) {
      return res.status(403).json({ error: 'You do not have access to this practice' });
    }
    const providerIds = await Provider.find({ practiceId }).distinct('_id');
    filter.providerId = { $in: providerIds };
  } else if (scopedProviderIds !== null) {
    filter.providerId = { $in: scopedProviderIds };
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
  if (!canAccessRecord(req.user, record)) {
    return res.status(403).json({ error: 'You do not have access to this credentialing record' });
  }
  res.json({ record });
};

// POST /api/credentialing
const createRecord = async (req, res) => {
  const provider = await Provider.findById(req.body.providerId).select('practiceId name');
  if (!provider || !canAccessProvider(req.user, provider)) {
    return res.status(403).json({ error: 'You do not have access to this provider' });
  }
  try {
    const record = await CredentialingRecord.create(req.body);
    await syncFollowUp(record, req);
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
  const record = await CredentialingRecord.findById(req.params.id)
    .populate('providerId', 'practiceId');
  if (!record) {
    return res.status(404).json({ error: 'Credentialing record not found' });
  }
  if (!canAccessProvider(req.user, record.providerId)) {
    return res.status(403).json({ error: 'You do not have access to this credentialing record' });
  }

  const changedFields = Object.keys(req.body);
  const previousStatus = record.status;
  Object.assign(record, req.body);
  await record.save();
  await syncFollowUp(record, req);

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
