const mail = require('../config/mail');
const templates = require('./emailTemplates');

let transport = null;

if (mail.provider === 'gmail' && mail.isLive) {
  const nodemailer = require('nodemailer');
  const gmail = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: mail.gmailUser, pass: mail.gmailAppPassword },
  });
  transport = async ({ to, subject, html }) => {
    const info = await gmail.sendMail({
      from: mail.from,
      to,
      subject,
      html,
      ...(mail.replyTo ? { replyTo: mail.replyTo } : {}),
    });
    return { id: info.messageId };
  };
  console.info(`Email provider: Gmail SMTP as ${mail.gmailUser}`);
} else if (mail.provider === 'resend' && mail.isLive) {
  const { Resend } = require('resend');
  const resend = new Resend(mail.resendApiKey);
  transport = async ({ to, subject, html }) => {
    const { data, error } = await resend.emails.send({
      from: mail.from,
      to: [to],
      subject,
      html,
      ...(mail.replyTo ? { replyTo: mail.replyTo } : {}),
    });
    // Most common failure: MAIL_FROM uses a domain that is not verified in Resend,
    // so Resend refuses to deliver to anybody but the account owner.
    if (error) throw new Error(error.message || 'Resend rejected the message.');
    return { id: data?.id };
  };
  console.info('Email provider: Resend');
} else {
  console.warn(
    'No email provider is configured, so emails will be logged instead of sent. '
      + 'Set MAIL_PROVIDER=gmail with GMAIL_USER and GMAIL_APP_PASSWORD to send real email.',
  );
}

/**
 * Send one message. Never throws: a failed notification must not roll back the
 * action that triggered it. A student who borrowed equipment still borrowed it
 * even if the confirmation email bounced. Callers receive {sent, error} instead.
 */
async function send(to, { subject, html }) {
  const recipient = String(to || '').trim();
  if (!recipient) return { sent: false, error: 'No recipient address.' };

  if (!transport) {
    console.info(`[email:not-sent] to=${recipient} subject="${subject}" (no provider configured)`);
    return { sent: false, error: 'Email is not configured.' };
  }

  try {
    const { id } = await transport({ to: recipient, subject, html });
    console.info(`[email:sent] to=${recipient} subject="${subject}" id=${id}`);
    return { sent: true, id };
  } catch (error) {
    console.error(`[email:failed] to=${recipient} subject="${subject}" -> ${error.message}`);
    return { sent: false, error: error.message };
  }
}

// Fire-and-forget: for notifications the user must not wait on the mail provider.
function sendInBackground(to, message) {
  Promise.resolve()
    .then(() => send(to, message))
    .catch((error) => console.error(`[email:background] ${error.message}`));
}

module.exports = {
  send,
  sendInBackground,
  templates,
  isLive: () => mail.isLive,
  provider: () => mail.provider,
};
