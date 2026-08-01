const Practice = require('../models/Practice.model');
const CredentialingRecord = require('../models/CredentialingRecord.model');

// GET /api/dashboard/summary
const getSummary = async (req, res) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [activePractices, approvedThisMonth, pendingCredentialing] = await Promise.all([
    Practice.countDocuments({ status: 'active' }),
    CredentialingRecord.countDocuments({ status: 'approved', updatedAt: { $gte: startOfMonth } }),
    CredentialingRecord.countDocuments({ status: { $in: ['not_started', 'in_progress', 'submitted'] } }),
  ]);

  res.json({ activePractices, approvedThisMonth, pendingCredentialing });
};

module.exports = { getSummary };
