const Practice = require('../models/Practice.model');
const Provider = require('../models/Provider.model');
const CredentialingRecord = require('../models/CredentialingRecord.model');
const { resolveVisibleScope } = require('../utils/scope.util');

// Escapes a cell for CSV: double-quote embedded quotes, wrap when needed.
const csvCell = (value) => {
  const str = value === null || value === undefined ? '' : String(value);
  return `"${str.replace(/"/g, '""')}"`;
};

// GET /api/reports/export — full CSV dump of the credentialing operation.
// Four sections: summary counts, practices, providers, and credentialing records.
const getSummaryCsv = async (req, res) => {
  // FR-001: reports are scoped to the requester's visible practices.
  const { practiceIds, providerIds, recordIds } = await resolveVisibleScope(req.user);
  const practiceFilter = practiceIds === null ? {} : { _id: { $in: practiceIds } };
  const providerFilter = providerIds === null ? {} : { _id: { $in: providerIds } };
  const recordFilter = recordIds === null ? {} : { _id: { $in: recordIds } };

  const [practiceCount, providerCount, recordCount, practices, providers, records] = await Promise.all([
    Practice.countDocuments(practiceFilter),
    Provider.countDocuments(providerFilter),
    CredentialingRecord.countDocuments(recordFilter),
    Practice.find(practiceFilter).sort({ groupName: 1 }).lean(),
    Provider.find(providerFilter).populate('practiceId', 'groupName').sort({ name: 1 }).lean(),
    CredentialingRecord.find(recordFilter)
      .populate('providerId', 'name npi')
      .populate('assignedTo', 'name email')
      .sort({ payerName: 1 })
      .lean(),
  ]);

  const lines = [];

  lines.push('BillVolt credentialing report');
  lines.push(['Generated', new Date().toISOString()].map(csvCell).join(','));
  lines.push(['Practices', practiceCount, 'Providers', providerCount, 'Credentialing records', recordCount].map(csvCell).join(','));
  lines.push('');

  lines.push('PRACTICES');
  lines.push(['Name', 'DBA', 'NPI', 'Tax ID', 'Status'].map(csvCell).join(','));
  for (const p of practices) {
    lines.push([p.groupName, p.dbaName, p.groupNpi, p.taxId, p.status].map(csvCell).join(','));
  }
  lines.push('');

  lines.push('PROVIDERS');
  lines.push(['Name', 'NPI', 'Practice', 'Specialty', 'Type', 'Status'].map(csvCell).join(','));
  for (const p of providers) {
    const practiceName = typeof p.practiceId === 'object' && p.practiceId ? p.practiceId.groupName : '';
    lines.push([p.name, p.npi, practiceName, p.specialty, p.providerType, p.status].map(csvCell).join(','));
  }
  lines.push('');

  lines.push('CREDENTIALING RECORDS');
  lines.push(['Provider', 'NPI', 'Payer', 'Status', 'Submitted', 'Approved', 'Expiration', 'Next follow-up', 'Assigned to'].map(csvCell).join(','));
  for (const r of records) {
    const providerName = typeof r.providerId === 'object' && r.providerId ? r.providerId.name : '';
    const providerNpi = typeof r.providerId === 'object' && r.providerId ? r.providerId.npi : '';
    const assigned = r.assignedTo && typeof r.assignedTo === 'object' ? r.assignedTo.email : '';
    lines.push([
      providerName,
      providerNpi,
      r.payerName,
      r.status,
      r.submittedDate ? r.submittedDate.toISOString().slice(0, 10) : '',
      r.approvedDate ? r.approvedDate.toISOString().slice(0, 10) : '',
      r.expirationDate ? r.expirationDate.toISOString().slice(0, 10) : '',
      r.nextFollowUpDate ? r.nextFollowUpDate.toISOString().slice(0, 10) : '',
      assigned,
    ].map(csvCell).join(','));
  }

  const filename = `reports-${new Date().toISOString().slice(0, 10)}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(lines.join('\r\n'));
};

const getSummary = async (req, res) => {
  const { practiceIds, providerIds, recordIds } = await resolveVisibleScope(req.user);
  const practiceFilter = practiceIds === null ? {} : { _id: { $in: practiceIds } };
  const providerFilter = providerIds === null ? {} : { _id: { $in: providerIds } };
  const recordProviderMatch = providerIds === null ? {} : { providerId: { $in: providerIds } };

  const [statusBreakdown, practiceCount, activePracticeCount, providerCount, activeProviderCount, topPayers] =
    await Promise.all([
      CredentialingRecord.aggregate([{ $match: recordProviderMatch }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Practice.countDocuments(practiceFilter),
      Practice.countDocuments({ status: 'active', ...practiceFilter }),
      Provider.countDocuments(providerFilter),
      Provider.countDocuments({ status: 'active', ...providerFilter }),
      CredentialingRecord.aggregate([
        { $match: recordProviderMatch },
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

module.exports = { getSummary, getSummaryCsv };
