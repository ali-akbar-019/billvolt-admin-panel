const Practice = require('../models/Practice.model');
const Provider = require('../models/Provider.model');
const CredentialingRecord = require('../models/CredentialingRecord.model');
const FollowUp = require('../models/FollowUp.model');

const startOfMonth = () => {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
};

const dayBounds = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// Last 6 months as [year, month] pairs, oldest first.
const lastMonths = (count = 6) => {
  const now = new Date();
  const months = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  return months;
};

// GET /api/dashboard/summary
// Rolls up the numbers and breakdowns behind the Dashboard's stat cards and charts.
const getSummary = async (req, res) => {
  const monthStart = startOfMonth();
  const { start: todayStart, end: todayEnd } = dayBounds();
  const trendFrom = new Date(`${lastMonths(6)[0].year}-${String(lastMonths(6)[0].month).padStart(2, '0')}-01T00:00:00.000Z`);

  const [
    activePractices,
    approvedThisMonth,
    pendingCredentialing,
    totalProviders,
    activeProviders,
    followUpsByStatus,
    credentialingByStatus,
    trend,
    topPayers,
  ] = await Promise.all([
    Practice.countDocuments({ status: 'active' }),
    CredentialingRecord.countDocuments({ status: 'approved', updatedAt: { $gte: monthStart } }),
    CredentialingRecord.countDocuments({ status: { $in: ['not_started', 'in_progress', 'submitted'] } }),
    Provider.countDocuments({}),
    Provider.countDocuments({ status: 'active' }),
    FollowUp.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    CredentialingRecord.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    CredentialingRecord.aggregate([
      { $match: { createdAt: { $gte: trendFrom } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, status: '$status' },
          count: { $sum: 1 },
        },
      },
    ]),
    CredentialingRecord.aggregate([
      { $group: { _id: '$payerName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const countsByKey = (rows) =>
    rows.reduce((acc, { _id, count }) => ({ ...acc, [_id]: count }), {});

  const followUpCounts = countsByKey(followUpsByStatus);
  const credStatusCounts = countsByKey(credentialingByStatus);

  const months = lastMonths(6);
  const trendByMonth = months.map(({ year, month }) => {
    const key = `${year}-${String(month).padStart(2, '0')}`;
    const bucket = trend
      .filter((row) => row._id.year === year && row._id.month === month)
      .reduce((acc, row) => ({ ...acc, [row._id.status]: row.count }), {});

    return {
      month: new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short' }),
      created: Object.values(bucket).reduce((sum, n) => sum + n, 0),
      inProgress: bucket.in_progress || 0,
      submitted: bucket.submitted || 0,
      approved: bucket.approved || 0,
      key,
    };
  });

  const dueToday = FollowUp.countDocuments({ status: 'pending', dueDate: { $gte: todayStart, $lte: todayEnd } });
  const overdue = FollowUp.countDocuments({ status: 'pending', dueDate: { $lt: todayStart } });
  const upcoming = FollowUp.countDocuments({ status: 'pending', dueDate: { $gt: todayEnd } });
  const [followUpsToday, followUpsOverdue, followUpsUpcoming] = await Promise.all([dueToday, overdue, upcoming]);

  res.json({
    activePractices,
    approvedThisMonth,
    pendingCredentialing,
    providers: { total: totalProviders, active: activeProviders },
    followUps: {
      overdue: followUpsOverdue,
      dueToday: followUpsToday,
      upcoming: followUpsUpcoming,
      completed: followUpCounts.completed || 0,
    },
    credentialingByStatus: credStatusCounts,
    trendByMonth,
    topPayers: topPayers.map((p) => ({ payerName: p._id, count: p.count })),
  });
};

module.exports = { getSummary };