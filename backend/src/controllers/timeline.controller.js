const TimelineEntry = require('../models/TimelineEntry.model');
const CredentialingRecord = require('../models/CredentialingRecord.model');
const AuditLog = require('../models/AuditLog.model');

const logAudit = (req, action, resourceId, metadata) =>
  AuditLog.create({
    userId: req.user._id,
    action,
    resourceType: 'TimelineEntry',
    resourceId,
    metadata,
    ipAddress: req.ip,
  }).catch((err) => console.error('Audit log failed:', err.message));

// GET /api/timeline?credentialingRecordId=... — newest first, no pagination cap (unlimited log per spec)
const listEntries = async (req, res) => {
  const { credentialingRecordId } = req.query;
  if (!credentialingRecordId) {
    return res.status(400).json({ error: 'credentialingRecordId is required' });
  }
  const entries = await TimelineEntry.find({ credentialingRecordId })
    .populate('userId', 'name')
    .sort({ createdAt: -1 });
  res.json({ entries });
};

// POST /api/timeline
const createEntry = async (req, res) => {
  const record = await CredentialingRecord.findById(req.body.credentialingRecordId);
  if (!record) {
    return res.status(404).json({ error: 'Credentialing record not found' });
  }

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
