const mail = require('../config/mail');
const templates = require('./emailTemplates');

let transport = null;

if (mail.provider === 'gmail' && mail.isLive) {
  const nodemailer = require('nodemailer');
  const gmail = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: mail.gmailUser, pass: mail.gmailAppPassword },
    // Most hosting platforms, Railway included, firewall outbound SMTP to stop
    // spam. Without these the socket sits open until the platform kills it and
    // the HTTP request that triggered the email hangs with it.
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 8000,
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
} else if (mail.provider === 'brevo' && mail.isLive) {
  // Brevo sends over HTTPS, so it works on hosts that firewall outbound SMTP.
  // Unlike Resend it only needs a single verified sender address, not a whole
  // verified domain, so a plain Gmail address can send to any recipient.
  transport = async ({ to, subject, html }) => {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': mail.brevoApiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: mail.appName, email: mail.brevoSender },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        ...(mail.replyTo ? { replyTo: { email: mail.replyTo } } : {}),
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      // Usually means the sender address has not been verified in Brevo yet.
      throw new Error(data.message || `Brevo rejected the message (HTTP ${response.status}).`);
    }
    return { id: data.messageId };
  };
  console.info(`Email provider: Brevo as ${mail.brevoSender}`);
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
const SEND_TIMEOUT_MS = Number(process.env.MAIL_TIMEOUT_MS || 10000);

async function send(to, { subject, html }) {
  const recipient = String(to || '').trim();
  if (!recipient) return { sent: false, error: 'No recipient address.' };

  if (!transport) {
    console.info(`[email:not-sent] to=${recipient} subject="${subject}" (no provider configured)`);
    return { sent: false, error: 'Email is not configured.' };
  }

  try {
    // A hard ceiling on top of the transport's own timeouts. Whatever the provider
    // does, the user's request is answered: a slow mail server must not become a
    // hanging sign-in or registration.
    const { id } = await Promise.race([
      transport({ to: recipient, subject, html }),
      new Promise((_, reject) => setTimeout(
        () => reject(new Error(`Mail provider did not respond within ${SEND_TIMEOUT_MS}ms.`)),
        SEND_TIMEOUT_MS,
      )),
    ]);
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
