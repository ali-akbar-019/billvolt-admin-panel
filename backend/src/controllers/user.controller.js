const User = require('../models/User.model');
const { revokeAllSessions } = require('../utils/session.service');

// GET /api/users — admin only
const listUsers = async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ users });
};

// PATCH /api/users/:id — update role and/or status. admin only.
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { role, status } = req.body;

  if (id === req.user._id.toString() && status === 'disabled') {
    return res.status(400).json({ error: "You can't disable your own account" });
  }

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (role) user.role = role;
  if (status) user.status = status;
  await user.save();

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
