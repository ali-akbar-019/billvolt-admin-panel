const FollowUp = require('../models/FollowUp.model');
const AuditLog = require('../models/AuditLog.model');

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

// GET /api/followups
// Query params: bucket (today|upcoming|overdue), status, assignedTo, page, limit
const listFollowUps = async (req, res) => {
  const { bucket, status, assignedTo } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 200);

  const filter = {};
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
  const { start: todayStart, end: todayEnd } = dayBounds();
  const [today, overdue, upcoming] = await Promise.all([
    FollowUp.countDocuments({ status: 'pending', dueDate: { $gte: todayStart, $lte: todayEnd } }),
    FollowUp.countDocuments({ status: 'pending', dueDate: { $lt: todayStart } }),
    FollowUp.countDocuments({ status: 'pending', dueDate: { $gt: todayEnd } }),
  ]);
  res.json({ today, overdue, upcoming });
};

// GET /api/followups/:id
const getFollowUp = async (req, res) => {
  const followUp = await FollowUp.findById(req.params.id).populate('assignedTo', 'name email');
  if (!followUp) {
    return res.status(404).json({ error: 'Follow-up not found' });
  }
  res.json({ followUp });
};

// POST /api/followups — manual creation, tied to a CredentialingRecord or Provider
const createFollowUp = async (req, res) => {
  const followUp = await FollowUp.create(req.body);
  await logAudit(req, 'create', followUp._id, { title: followUp.title, linkedType: followUp.linkedType });
  const populated = await followUp.populate('assignedTo', 'name email');
  res.status(201).json({ followUp: populated });
};

// PATCH /api/followups/:id — edit, reschedule, or mark complete/pending
const updateFollowUp = async (req, res) => {
  const followUp = await FollowUp.findById(req.params.id);
  if (!followUp) {
    return res.status(404).json({ error: 'Follow-up not found' });
  }

  const changedFields = Object.keys(req.body);
  Object.assign(followUp, req.body);
  await followUp.save();

  await logAudit(req, 'update', followUp._id, { changedFields });
  const populated = await followUp.populate('assignedTo', 'name email');
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

module.exports = { listFollowUps, getCounts, getFollowUp, createFollowUp, updateFollowUp, deleteFollowUp };
