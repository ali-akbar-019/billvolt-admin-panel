// FR-001 practice scoping. Admins are unrestricted; staff only see the
// practices they're assigned to. Every controller query for practices,
// providers, credentialing, timeline, follow-ups, dashboard and reports
// routes through one of these helpers so the policy lives in one place.

// Returns the practice ids a user may see, or `null` when unrestricted.
const visiblePracticeIds = (user) =>
  user.role === 'admin' ? null : (user.assignedPracticeIds || []);

// Mongo filter clause that restricts a query to the visible practice ids.
// For admins it's an empty clause (see everything); for staff, an empty
// assignment list means "no practices" — an `_id: { $in: [] }` filter
// correctly returns zero rows.
const practiceScopeFilter = (user) => {
  const ids = visiblePracticeIds(user);
  return ids === null ? {} : { _id: { $in: ids } };
};

// True when `user` may access the given practice (id or populated doc).
const canAccessPractice = (user, practice) => {
  const ids = visiblePracticeIds(user);
  if (ids === null) return true;
  const practiceId = practice && practice._id ? practice._id : practice;
  return ids.some((id) => id.toString() === practiceId.toString());
};

// True when `user` may access a provider (id or doc with a `practiceId`).
const canAccessProvider = (user, provider) => {
  if (visiblePracticeIds(user) === null) return true;
  if (!provider) return false;
  const practiceId = provider.practiceId && provider.practiceId._id ? provider.practiceId._id : provider.practiceId;
  return practiceId ? canAccessPractice(user, practiceId) : false;
};

// True when `user` may access a credentialing record (via its provider).
const canAccessRecord = (user, record) => {
  if (visiblePracticeIds(user) === null) return true;
  return record && canAccessProvider(user, record.providerId);
};

// Resolves the visible set for a staff user: practice ids -> provider ids
// -> credentialing record ids. Admins get nulls (unrestricted) so callers
// can branch without a separate role check.
const resolveVisibleScope = async (user) => {
  if (user.role === 'admin') {
    return { practiceIds: null, providerIds: null, recordIds: null };
  }

  const practiceIds = visiblePracticeIds(user);
  const Provider = require('../models/Provider.model');
  const CredentialingRecord = require('../models/CredentialingRecord.model');

  const providerIds = await Provider.find({ practiceId: { $in: practiceIds } }).distinct('_id');
  const recordIds = await CredentialingRecord.find({ providerId: { $in: providerIds } }).distinct('_id');

  return { practiceIds, providerIds, recordIds };
};

// Mongo filter that restricts a FollowUp query to the follow-ups attached to
// visible credentialing records or visible providers. Empty object for admins.
const followUpScopeFilter = async (user) => {
  if (user.role === 'admin') return {};
  const { providerIds, recordIds } = await resolveVisibleScope(user);
  return {
    $or: [
      { linkedType: 'CredentialingRecord', linkedId: { $in: recordIds } },
      { linkedType: 'Provider', linkedId: { $in: providerIds } },
    ],
  };
};

// True when `user` may access a follow-up. The linked entity resolves
// server-side: a CredentialingRecord must be visible, or a Provider must be
// visible. Returns false for unknown linked types.
const canAccessFollowUp = async (user, followUp) => {
  if (!followUp) return false;
  if (user.role === 'admin') return true;

  const Provider = require('../models/Provider.model');
  const CredentialingRecord = require('../models/CredentialingRecord.model');

  if (followUp.linkedType === 'CredentialingRecord') {
    const record = await CredentialingRecord.findById(followUp.linkedId).populate('providerId', 'practiceId');
    return canAccessRecord(user, record);
  }
  if (followUp.linkedType === 'Provider') {
    const provider = await Provider.findById(followUp.linkedId).select('practiceId');
    return canAccessProvider(user, provider);
  }
  return false;
};

module.exports = {
  visiblePracticeIds,
  practiceScopeFilter,
  canAccessPractice,
  canAccessProvider,
  canAccessRecord,
  canAccessFollowUp,
  resolveVisibleScope,
  followUpScopeFilter,
};