// AI Credentialing Assistant Agent (FR-007).
//
// Pipeline, exactly as the spec requires:
//   User Question -> AI Agent (this file, pattern-matching only) ->
//   Credentialing Search Engine (services/credentialingSearch.service.js) ->
//   Permission Filter (permissionFilter below) -> Database -> AI Response
//
// The agent never queries the database directly — it only ever calls the
// search service, and every response is built from what that service
// returns, not from anything invented.

const AuditLog = require('../models/AuditLog.model');
const search = require('../services/credentialingSearch.service');
const { canAccessPractice, canAccessProvider, canAccessRecord, canAccessFollowUp } = require('../utils/scope.util');

const logQuery = (req, question, response) =>
  AuditLog.create({
    userId: req.user._id,
    action: 'ai_query',
    resourceType: 'AIQuery',
    resourceId: req.user._id, // no single resource — logged against the asking user
    metadata: { question, response },
    ipAddress: req.ip,
  }).catch((err) => console.error('Audit log failed:', err.message));

// FR-001 permission filter: drops any search result the requesting user can't
// see. Admins pass everything through; staff only keep results that belong to
// an assigned practice (practices themselves, or providers/records/follow-ups
// linked into their assigned practices).
const applyPermissionFilter = async (req, results) => {
  if (!Array.isArray(results) || req.user.role === 'admin') return results;

  const visible = [];
  for (const result of results) {
    const allowed = await (() => {
      if (result.constructor?.modelName === 'Practice') return canAccessPractice(req.user, result);
      if (result.constructor?.modelName === 'Provider') return canAccessProvider(req.user, result);
      if (result.constructor?.modelName === 'CredentialingRecord') return canAccessRecord(req.user, result);
      if (result.constructor?.modelName === 'FollowUp') return canAccessFollowUp(req.user, result);
      return true;
    })();
    if (allowed) visible.push(result);
  }
  return visible;
};

const wantsFollowUpsToday = (q) => /follow[\s-]?up/.test(q) && /(today|due)/.test(q);
const wantsPendingForPractice = (q) => /pending/.test(q);

// POST /api/ai/query — { question: string }
const askQuestion = async (req, res) => {
  const question = (req.body.question || '').trim();
  if (!question) {
    return res.status(400).json({ error: 'question is required' });
  }
  const q = question.toLowerCase();

  // Intent 1: follow-ups due today
  if (wantsFollowUpsToday(q)) {
    const followUps = await applyPermissionFilter(req, await search.findDueTodayFollowUps());
    const response =
      followUps.length === 0
        ? 'Nothing is due today.'
        : `${followUps.length} follow-up${followUps.length === 1 ? '' : 's'} due today: ` +
          followUps.map((f) => f.title).join('; ') + '.';
    await logQuery(req, question, response);
    return res.json({ answer: response, data: followUps });
  }

  // Intent 2: pending payers for a practice — find a practice name mentioned in the question
  if (wantsPendingForPractice(q)) {
    const practices = await applyPermissionFilter(req, await search.findPracticesByName(extractLikelyName(question)));
    if (practices.length === 0) {
      const response = "I couldn't find a practice matching that in your question. Which practice did you mean?";
      await logQuery(req, question, response);
      return res.json({ answer: response, data: [] });
    }
    if (practices.length > 1) {
      const response = `That matches more than one practice: ${practices.map((p) => p.groupName).join(', ')}. Which one did you mean?`;
      await logQuery(req, question, response);
      return res.json({ answer: response, data: practices.map((p) => ({ id: p._id, name: p.groupName })) });
    }

    const practice = practices[0];
    const records = await applyPermissionFilter(req, await search.findPendingRecordsForPractice(practice._id));
    const response =
      records.length === 0
        ? `${practice.groupName} has no pending payer applications right now.`
        : `${practice.groupName} has ${records.length} pending payer application${records.length === 1 ? '' : 's'}: ` +
          records.map((r) => `${r.payerName} for ${r.providerId?.name || 'an unassigned provider'} (${r.status})`).join('; ') + '.';
    await logQuery(req, question, response);
    return res.json({ answer: response, data: records });
  }

  // Intent 3: provider + payer status lookup — find any provider name mentioned in the question
  const providerFragment = extractLikelyName(question);
  const providers = await applyPermissionFilter(req, await search.findProvidersByName(providerFragment));

  if (providers.length === 0) {
    const response =
      "I couldn't find a provider matching that. Try asking like: \"status for Dr. Khan payer Aetna\", " +
      '"pending payers for Acme Medical Group", or "what follow-ups are due today".';
    await logQuery(req, question, response);
    return res.json({ answer: response, data: [] });
  }

  if (providers.length > 1) {
    const response = `More than one provider matches that: ${providers.map((p) => p.name).join(', ')}. Which one did you mean?`;
    await logQuery(req, question, response);
    return res.json({ answer: response, data: providers.map((p) => ({ id: p._id, name: p.name })) });
  }

  const provider = providers[0];
  const payerFragment = extractPayerFragment(question, provider.name);
  const record = await search.findPayerRecordForProvider(provider._id, payerFragment || '');

  if (!record) {
    const response = payerFragment
      ? `No credentialing activity found for ${provider.name} with a payer matching "${payerFragment}".`
      : `${provider.name} has no credentialing records yet. Which payer did you want the status for?`;
    await logQuery(req, question, response);
    return res.json({ answer: response, data: null });
  }

  const response =
    `${provider.name} at ${provider.practiceId?.groupName || 'an unlinked practice'} — ${record.payerName}: ` +
    `${record.status}${record.expirationDate ? `, expires ${new Date(record.expirationDate).toLocaleDateString()}` : ''}` +
    `${record.notes ? `. Latest note: ${record.notes}` : ''}.`;
  await logQuery(req, question, response);
  res.json({ answer: response, data: record });
};

// Very small heuristic: pull out capitalized word sequences (likely a proper
// noun — a name) from the raw (non-lowercased) question. Falls back to the
// longest word if nothing looks capitalized, so short/lowercase questions
// still get a best-effort match instead of nothing.
function extractLikelyName(question) {
  const capitalized = question.match(/([A-Z][a-zA-Z'.-]*\s?){1,4}/g) || [];
  const candidates = capitalized.map((s) => s.trim()).filter((s) => s.length > 2);
  if (candidates.length > 0) return candidates.sort((a, b) => b.length - a.length)[0];
  const words = question.split(/\s+/).filter((w) => w.length > 3);
  return words.sort((a, b) => b.length - a.length)[0] || question;
}

function extractPayerFragment(question, providerName) {
  const withoutProvider = question.replace(new RegExp(providerName, 'i'), '');
  const match = withoutProvider.match(/(?:payer|for|with)\s+([A-Za-z][A-Za-z\s]{2,30})/i);
  return match ? match[1].trim() : null;
}

module.exports = { askQuestion };
