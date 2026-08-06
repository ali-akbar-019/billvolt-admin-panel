const Practice = require('../models/Practice.model');
const Provider = require('../models/Provider.model');
const CredentialingRecord = require('../models/CredentialingRecord.model');

// GET /api/reports/summary
// Rolls up counts by credentialing status, practice, and provider — no charting lib needed,
// the frontend renders this as simple bar-style rows.
const getSummary = async (req, res) => {
  const [statusBreakdown, practiceCount, activePracticeCount, providerCount, activeProviderCount, topPayers] =
    await Promise.all([
      CredentialingRecord.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Practice.countDocuments({}),
      Practice.countDocuments({ status: 'active' }),
      Provider.countDocuments({}),
      Provider.countDocuments({ status: 'active' }),
      CredentialingRecord.aggregate([
        { $group: { _id: '$payerName', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

  const statusMap = statusBreakdown.reduce((acc, { _id, count }) => ({ ...acc, [_id]: count }), {});

  res.json({
    practices: { total: practiceCount, active: activePracticeCount },
    providers: { total: providerCount, active: activeProviderCount },
    credentialingByStatus: statusMap,
    topPayers: topPayers.map((p) => ({ payerName: p._id, count: p.count })),
  });
};

module.exports = { getSummary };
