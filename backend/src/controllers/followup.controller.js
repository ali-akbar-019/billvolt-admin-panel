const FollowUp = require('../models/FollowUp.model');
const AuditLog = require('../models/AuditLog.model');
const OrgSettings = require('../models/OrgSettings.model');
const { sendFollowUpDigest } = require('../services/followUpNotify.service');
const { canAccessRecord, canAccessProvider, canAccessFollowUp, followUpScopeFilter } = require('../utils/scope.util');

const logAudit = (req, action, resourceId, metadata) =>
  AuditLog.create({
    userId: req.user._id,
    action,
    resourceType: 'FollowUp',
    resourceId,
    metadata,
    ipAddress: req.ip,
  }).catch((err) => console.error('Audit log failed:', err.message));

const dayBounds = (offsetDays = 0) => {
  const start = new Date();
  start.setDate(start.getDate() + offsetDays);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// Loads org settings so the notification digest can respect the toggle and
// fall back to the org contact email when a follow-up has no assignee.
const getOrgContext = async () => {
  let settings = await OrgSettings.findOne();
  if (!settings) settings = await OrgSettings.create({});
  return {
    notifyEnabled: settings.notifyOnOverdueFollowUps !== false,
    orgContactEmail: settings.contactEmail,
  };
};

// Sends a digest for follow-ups that are pending and due today or overdue.
// No-op when notifications are off; never throws into request handlers.
const notifyForFollowUps = async (followUps) => {
  try {
    const { notifyEnabled, orgContactEmail } = await getOrgContext();
    if (!notifyEnabled) return;
    const pending = followUps.filter((f) => f.status === 'pending');
    const due = pending.filter((f) => f.dueDate <= dayBounds().end);
    if (due.length === 0) return;
    await sendFollowUpDigest(due, { orgContactEmail });
  } catch (err) {
    console.error('Notification digest failed:', err.message);
  }
};

// POST /api/followups/notify — admin manual re-send of a digest for the
// currently pending overdue / due-today follow-ups.
const notifyOverdue = async (req, res) => {
  const { start: todayStart, end: todayEnd } = dayBounds();
  const followUps = await FollowUp.find({
    status: 'pending',
    dueDate: { $lte: todayEnd },
  })
    .populate('assignedTo', 'name email')
    .sort({ dueDate: 1 });

  await notifyForFollowUps(followUps);

  await AuditLog.create({
    userId: req.user._id,
    action: 'notify',
    resourceType: 'FollowUp',
    resourceId: followUps[0]?._id,
    metadata: { manual: true, count: followUps.length },
    ipAddress: req.ip,
  }).catch((err) => console.error('Audit log failed:', err.message));

  res.json({ message: `Notification digest sent for ${followUps.length} follow-up(s)`, count: followUps.length });
};

// GET /api/followups
// Query params: bucket (today|upcoming|overdue), status, assignedTo, page, limit
const listFollowUps = async (req, res) => {
  const { bucket, status, assignedTo } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 200);

  const filter = await followUpScopeFilter(req.user);
  if (assignedTo) filter.assignedTo = assignedTo;
  if (status) filter.status = status;

  const { start: todayStart, end: todayEnd } = dayBounds();

  if (bucket === 'today') {
    filter.status = 'pending';
    filter.dueDate = { $gte: todayStart, $lte: todayEnd };
  } else if (bucket === 'overdue') {
    filter.status = 'pending';
    filter.dueDate = { $lt: todayStart };
  } else if (bucket === 'upcoming') {
    filter.status = 'pending';
    filter.dueDate = { $gt: todayEnd };
  }

  const [followUps, total] = await Promise.all([
    FollowUp.find(filter)
      .populate('assignedTo', 'name email')
      .sort({ dueDate: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    FollowUp.countDocuments(filter),
  ]);

  const withOverdueFlag = followUps.map((f) => {
    const obj = f.toObject();
    if (f.status === 'pending' && f.dueDate < todayStart) {
      obj.daysOverdue = Math.floor((todayStart - f.dueDate) / (1000 * 60 * 60 * 24));
    }
    return obj;
  });

  res.json({ followUps: withOverdueFlag, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
};

// GET /api/followups/counts — quick counts for dashboard badges
const getCounts = async (req, res) => {
  const scopeFilter = await followUpScopeFilter(req.user);
  const { start: todayStart, end: todayEnd } = dayBounds();
  const [today, overdue, upcoming] = await Promise.all([
    FollowUp.countDocuments({ ...scopeFilter, status: 'pending', dueDate: { $gte: todayStart, $lte: todayEnd } }),
    FollowUp.countDocuments({ ...scopeFilter, status: 'pending', dueDate: { $lt: todayStart } }),
    FollowUp.countDocuments({ ...scopeFilter, status: 'pending', dueDate: { $gt: todayEnd } }),
  ]);
  res.json({ today, overdue, upcoming });
};

// GET /api/followups/:id
const getFollowUp = async (req, res) => {
  const followUp = await FollowUp.findById(req.params.id).populate('assignedTo', 'name email');
  if (!followUp) {
    return res.status(404).json({ error: 'Follow-up not found' });
  }
  if (!(await canAccessFollowUp(req.user, followUp))) {
    return res.status(403).json({ error: 'You do not have access to this follow-up' });
  }
  res.json({ followUp });
};

// POST /api/followups — manual creation, tied to a CredentialingRecord or Provider
const createFollowUp = async (req, res) => {
  const { linkedType, linkedId } = req.body;
  if (linkedType === 'CredentialingRecord') {
    const record = await require('../models/CredentialingRecord.model').findById(linkedId).populate('providerId', 'practiceId');
    if (!(await canAccessRecord(req.user, record))) {
      return res.status(403).json({ error: 'You do not have access to this credentialing record' });
    }
  } else if (linkedType === 'Provider') {
    const provider = await require('../models/Provider.model').findById(linkedId).select('practiceId');
    if (!canAccessProvider(req.user, provider)) {
      return res.status(403).json({ error: 'You do not have access to this provider' });
    }
  }
  const followUp = await FollowUp.create(req.body);
  await logAudit(req, 'create', followUp._id, { title: followUp.title, linkedType: followUp.linkedType });
  const populated = await followUp.populate('assignedTo', 'name email');
  await notifyForFollowUps([populated]);
  res.status(201).json({ followUp: populated });
};

// PATCH /api/followups/:id — edit, reschedule, or mark complete/pending
const updateFollowUp = async (req, res) => {
  const followUp = await FollowUp.findById(req.params.id);
  if (!followUp) {
    return res.status(404).json({ error: 'Follow-up not found' });
  }
  if (!(await canAccessFollowUp(req.user, followUp))) {
    return res.status(403).json({ error: 'You do not have access to this follow-up' });
  }

  const changedFields = Object.keys(req.body);
  Object.assign(followUp, req.body);
  await followUp.save();

  await logAudit(req, 'update', followUp._id, { changedFields });
  const populated = await followUp.populate('assignedTo', 'name email');
  await notifyForFollowUps([populated]);
  res.json({ followUp: populated });
};

// DELETE /api/followups/:id — admin only (enforced in routes)
const deleteFollowUp = async (req, res) => {
  const followUp = await FollowUp.findByIdAndDelete(req.params.id);
  if (!followUp) {
    return res.status(404).json({ error: 'Follow-up not found' });
  }
  await logAudit(req, 'delete', followUp._id, { title: followUp.title });
  res.json({ message: 'Follow-up deleted' });
};

module.exports = { listFollowUps, getCounts, getFollowUp, createFollowUp, updateFollowUp, deleteFollowUp, notifyOverdue, notifyForFollowUps };
