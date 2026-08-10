const OrgSettings = require('../models/OrgSettings.model');
const AuditLog = require('../models/AuditLog.model');

// Lazily creates the single settings row on first access.
const getOrCreateSettings = async () => {
  let settings = await OrgSettings.findOne();
  if (!settings) {
    settings = await OrgSettings.create({});
  }
  return settings;
};

// GET /api/settings
const getSettings = async (req, res) => {
  const settings = await getOrCreateSettings();
  res.json({ settings });
};

// PATCH /api/settings — admin only (enforced in routes)
const updateSettings = async (req, res) => {
  const settings = await getOrCreateSettings();
  const changedFields = Object.keys(req.body);
  Object.assign(settings, req.body, { updatedBy: req.user._id });
  await settings.save();

  await AuditLog.create({
    userId: req.user._id,
    action: 'update',
    resourceType: 'OrgSettings',
    resourceId: settings._id,
    metadata: { changedFields },
    ipAddress: req.ip,
  }).catch((err) => console.error('Audit log failed:', err.message));

  res.json({ settings });
};

module.exports = { getSettings, updateSettings };
