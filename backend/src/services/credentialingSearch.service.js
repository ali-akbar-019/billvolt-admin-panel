// The "Credentialing Search Engine" from FR-007: the only layer allowed to
// touch the database on behalf of a query. The AI agent (ai.controller.js)
// never runs its own DB queries — it only calls functions here.
const Provider = require('../models/Provider.model');
const Practice = require('../models/Practice.model');
const CredentialingRecord = require('../models/CredentialingRecord.model');
const FollowUp = require('../models/FollowUp.model');

// Finds providers whose name contains the given fragment (case-insensitive).
const findProvidersByName = async (fragment) =>
  Provider.find({ name: { $regex: fragment, $options: 'i' } })
    .populate('practiceId', 'groupName')
    .limit(10);

const findPracticesByName = async (fragment) =>
  Practice.find({
    $or: [{ groupName: { $regex: fragment, $options: 'i' } }, { dbaName: { $regex: fragment, $options: 'i' } }],
  }).limit(10);

const findPayerRecordForProvider = async (providerId, payerFragment) =>
  CredentialingRecord.findOne({
    providerId,
    payerName: { $regex: payerFragment, $options: 'i' },
  }).sort({ updatedAt: -1 });

const findPendingRecordsForPractice = async (practiceId) => {
  const providerIds = await Provider.find({ practiceId }).distinct('_id');
  return CredentialingRecord.find({
    providerId: { $in: providerIds },
    status: { $in: ['not_started', 'in_progress', 'submitted'] },
  })
    .populate('providerId', 'name')
    .sort({ updatedAt: -1 });
};

const findDueTodayFollowUps = async () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return FollowUp.find({ status: 'pending', dueDate: { $gte: start, $lte: end } }).sort({ dueDate: 1 });
};

const listKnownPayerNames = async () => CredentialingRecord.distinct('payerName');

module.exports = {
  findProvidersByName,
  findPracticesByName,
  findPayerRecordForProvider,
  findPendingRecordsForPractice,
  findDueTodayFollowUps,
  listKnownPayerNames,
};
