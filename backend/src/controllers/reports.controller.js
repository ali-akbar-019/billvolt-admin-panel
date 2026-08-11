const Practice = require('../models/Practice.model');
const Provider = require('../models/Provider.model');
const CredentialingRecord = require('../models/CredentialingRecord.model');

// Escapes a cell for CSV: double-quote embedded quotes, wrap when needed.
const csvCell = (value) => {
  const str = value === null || value === undefined ? '' : String(value);
  return `"${str.replace(/"/g, '""')}"`;
};

// GET /api/reports/export — full CSV dump of the credentialing operation.
// Four sections: summary counts, practices, providers, and credentialing records.
const getSummaryCsv = async (req, res) => {
  const [practiceCount, providerCount, recordCount, practices, providers, records] = await Promise.all([
    Practice.countDocuments({}),
    Provider.countDocuments({}),
    CredentialingRecord.countDocuments({}),
    Practice.find({}).sort({ groupName: 1 }).lean(),
    Provider.find({}).populate('practiceId', 'groupName').sort({ name: 1 }).lean(),
    CredentialingRecord.find({})
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

module.exports = { getSummary, getSummaryCsv };
