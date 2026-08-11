const { sendMail } = require('./mailer.service');

// Composes and sends a digest of the given follow-ups to each distinct
// assigned user (falling back to the org contact email). Respects the org
// settings toggle. Non-blocking: errors are logged, never thrown up to
// request handlers.
const sendFollowUpDigest = async (followUps, { orgContactEmail } = {}) => {
  if (!followUps || followUps.length === 0) return;

  const byRecipient = new Map();
  for (const f of followUps) {
    const email = f.assignedTo?.email;
    if (!email) continue;
    if (!byRecipient.has(email)) byRecipient.set(email, []);
    byRecipient.get(email).push(f);
  }

  // If nothing was assigned, fall back to a single digest to the org contact.
  if (byRecipient.size === 0 && orgContactEmail) {
    byRecipient.set(orgContactEmail, followUps);
  }

  for (const [email, items] of byRecipient.entries()) {
    const lines = items.map((f) => {
      const overdue = f.status === 'pending' && f.dueDate < new Date();
      const when = overdue ? `OVERDUE (${f.dueDate.toLocaleDateString()})` : `due ${f.dueDate.toLocaleDateString()}`;
      return `- [${f.priority || 'medium'}] ${f.title} — ${when}`;
    });

    await sendMail({
      to: email,
      subject: `${items.length} follow-up${items.length === 1 ? '' : 's'} need attention`,
      text: [
        'A few credentialing follow-ups need attention in BillVolt:',
        '',
        ...lines,
        '',
        'Sign in to the portal to update them.',
      ].join('\n'),
    });
  }
};

module.exports = { sendFollowUpDigest };