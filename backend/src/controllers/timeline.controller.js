const TimelineEntry = require('../models/TimelineEntry.model');
const CredentialingRecord = require('../models/CredentialingRecord.model');
const AuditLog = require('../models/AuditLog.model');
const { canAccessRecord, visiblePracticeIds } = require('../utils/scope.util');

const logAudit = (req, action, resourceId, metadata) =>
  AuditLog.create({
    userId: req.user._id,
    action,
    resourceType: 'TimelineEntry',
    resourceId,
    metadata,
    ipAddress: req.ip,
  }).catch((err) => console.error('Audit log failed:', err.message));

// Loads the record the timeline belongs to, verifying the requester can see
// it. Returns the record or null (after sending a 403/404).
const loadAccessibleRecord = async (req, res, credentialingRecordId) => {
  const record = await CredentialingRecord.findById(credentialingRecordId).populate('providerId', 'practiceId');
  if (!record) {
    return res.status(404).json({ error: 'Credentialing record not found' });
  }
  if (!canAccessRecord(req.user, record)) {
    return res.status(403).json({ error: 'You do not have access to this credentialing record' });
  }
  return record;
};

// GET /api/timeline?credentialingRecordId=... — newest first, no pagination cap (unlimited log per spec)
const listEntries = async (req, res) => {
  const { credentialingRecordId } = req.query;
  if (!credentialingRecordId) {
    return res.status(400).json({ error: 'credentialingRecordId is required' });
  }
  if (visiblePracticeIds(req.user) !== null) {
    const record = await loadAccessibleRecord(req, res, credentialingRecordId);
    if (!record) return;
  }
  const entries = await TimelineEntry.find({ credentialingRecordId })
    .populate('userId', 'name')
    .sort({ createdAt: -1 });
  res.json({ entries });
};

// POST /api/timeline
const createEntry = async (req, res) => {
  if (visiblePracticeIds(req.user) !== null && !req.body.credentialingRecordId) {
    return res.status(400).json({ error: 'credentialingRecordId is required' });
  }
  const record = await loadAccessibleRecord(req, res, req.body.credentialingRecordId);
  if (!record) return;

  const entry = await TimelineEntry.create({ ...req.body, userId: req.user._id });
  await logAudit(req, 'create', entry._id, { credentialingRecordId: record._id, activityType: entry.activityType });
  const populated = await entry.populate('userId', 'name');
  res.status(201).json({ entry: populated });
};

// DELETE /api/timeline/:id — admin only (enforced in routes); entries are otherwise immutable
const deleteEntry = async (req, res) => {
  const entry = await TimelineEntry.findByIdAndDelete(req.params.id);
  if (!entry) {
    return res.status(404).json({ error: 'Timeline entry not found' });
  }
  await logAudit(req, 'delete', entry._id, {});
  res.json({ message: 'Timeline entry deleted' });
};

module.exports = { listEntries, createEntry, deleteEntry };
