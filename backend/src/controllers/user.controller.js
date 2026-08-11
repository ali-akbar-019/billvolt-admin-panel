const User = require('../models/User.model');
const AuditLog = require('../models/AuditLog.model');
const { revokeAllSessions } = require('../utils/session.service');

// GET /api/users — admin only
const listUsers = async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ users });
};

// PATCH /api/users/:id — update role, status, and/or practice assignments. admin only.
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { role, status, assignedPracticeIds } = req.body;

  if (id === req.user._id.toString() && status === 'disabled') {
    return res.status(400).json({ error: "You can't disable your own account" });
  }

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (role) user.role = role;
  if (status) user.status = status;
  if (assignedPracticeIds) {
    if (!Array.isArray(assignedPracticeIds) || assignedPracticeIds.some((p) => typeof p !== 'string')) {
      return res.status(400).json({ error: 'assignedPracticeIds must be an array of practice ids' });
    }
    user.assignedPracticeIds = assignedPracticeIds;
  }
  await user.save();

  await AuditLog.create({
    userId: req.user._id,
    action: 'update',
    resourceType: 'User',
    resourceId: user._id,
    metadata: {
      changedFields: Object.keys(req.body),
      ...(assignedPracticeIds ? { assignedPracticeIds: assignedPracticeIds.length } : {}),
    },
    ipAddress: req.ip,
  }).catch((err) => console.error('Audit log failed:', err.message));

  // If the account was just disabled, kill any active sessions immediately
  if (status === 'disabled') {
    await revokeAllSessions(user._id.toString());
  }

  res.json({ user });
};

// DELETE /api/users/:id — admin only
const deleteUser = async (req, res) => {
  const { id } = req.params;

  if (id === req.user._id.toString()) {
    return res.status(400).json({ error: "You can't delete your own account" });
  }

  const user = await User.findByIdAndDelete(id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  await revokeAllSessions(id);
  res.json({ message: 'User deleted' });
};

module.exports = { listUsers, updateUser, deleteUser };
