const nodemailer = require('nodemailer');

// SMTP transport built from env vars. If emailing is not configured, the
// app still runs — sendMail() just logs the would-be email to the console
// so the rest of the flow works with zero config.
const EMAIL_ENABLED =
  process.env.EMAIL_ENABLED === 'true' &&
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;

if (EMAIL_ENABLED) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587/STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Send an email — or, when SMTP isn't configured, log the message to the
 * console so behaviour is observable during development.
 *
 * @param {{ to: string; subject: string; text: string }} message
 * @returns {Promise<boolean>} true if the message was sent (or logged)
 */
const sendMail = async ({ to, subject, text }) => {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'billvolt@localhost';

  if (!EMAIL_ENABLED || !transporter) {
    console.log(`[mailer] SMTP not configured — would send email to ${to}`);
    console.log(`[mailer] subject: ${subject}`);
    console.log(`[mailer] body:\n${text}`);
    return true;
  }

  try {
    await transporter.sendMail({ from, to, subject, text });
    console.log(`[mailer] sent to ${to}: ${subject}`);
    return true;
  } catch (err) {
    console.error('[mailer] failed to send:', err.message);
    return false;
  }
};

module.exports = { sendMail };