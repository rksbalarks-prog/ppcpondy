// Thin nodemailer wrapper.
//
// The transport is created lazily and cached, so a server booted without SMTP
// credentials never touches the network — isConfigured() is false and the
// scheduler simply declines to start. That keeps this layer inert on any
// environment where the mail secrets have not been filled in.
//
// This is the single transport for the whole backend: AdminReportMail,
// AdminExcelMail and BackupMail all send through it.

const nodemailer = require('nodemailer');
const config = require('./config');

let transporter = null;

/** True once host + user + pass are present in .env. */
function isConfigured() {
  const { host, user, pass } = config.smtp;
  return Boolean(host && user && pass);
}

/** Which piece of the SMTP config is missing, for a useful log line. */
function missingSettings() {
  const missing = [];
  if (!config.smtp.host) missing.push('SMTP_HOST');
  if (!config.smtp.user) missing.push('SMTP_USER');
  if (!config.smtp.pass) missing.push('SMTP_PASS');
  if (!config.to.length) missing.push('DATA_ADDED_REPORT_TO');
  return missing;
}

function getTransporter() {
  if (!isConfigured()) return null;
  if (!transporter) {
    const { host, port, secure, user, pass } = config.smtp;
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      // A handful of mails a day — a pooled connection would only sit idle.
      pool: false,
      connectionTimeout: 20000,
      greetingTimeout: 20000,
      socketTimeout: 30000,
    });
  }
  return transporter;
}

/** Open an SMTP connection and authenticate, without sending anything. */
async function verify() {
  const tx = getTransporter();
  if (!tx) throw new Error(`SMTP not configured — missing ${missingSettings().join(', ')}`);
  await tx.verify();
  return true;
}

/**
 * @param {object} message  { to, cc, bcc, subject, html, text, attachments }
 * @returns {Promise<{ messageId: string, accepted: string[], rejected: string[] }>}
 */
async function sendMail(message) {
  const tx = getTransporter();
  if (!tx) throw new Error(`SMTP not configured — missing ${missingSettings().join(', ')}`);

  const info = await tx.sendMail({
    from: config.smtp.from || config.smtp.user,
    ...message,
  });

  return {
    messageId: info.messageId,
    accepted: info.accepted || [],
    rejected: info.rejected || [],
  };
}

module.exports = { isConfigured, missingSettings, getTransporter, verify, sendMail };
