// Central mail configuration.
//
// IMPORTANT: Railway, like most hosting platforms, firewalls outbound SMTP (ports 25,
// 465, 587) to stop spam. Gmail SMTP therefore works on a laptop but times out in
// production. Anything deployed must send over HTTPS instead.
//
//   MAIL_PROVIDER=brevo      Brevo HTTP API. Works on Railway, and needs only a single
//                            VERIFIED SENDER ADDRESS (a plain Gmail address is fine)
//                            to send to any recipient. 300 mails/day on the free plan.
//                            Needs BREVO_API_KEY and BREVO_SENDER. USE IN PRODUCTION.
//
//   MAIL_PROVIDER=gmail      Gmail SMTP with an App Password. Fine for LOCAL testing,
//                            but will NOT work on Railway.
//
//   MAIL_PROVIDER=resend     Resend HTTP API. Works on Railway, but only delivers to
//                            arbitrary recipients from a DNS-verified domain, so it is
//                            unusable without a domain you control.
//
// With none configured the service logs the message instead of sending, so local
// development, the offline presentation store, and the verification suite still run.
const parseList = (value, fallback) =>
  String(value || fallback)
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

const provider = String(process.env.MAIL_PROVIDER || '').trim().toLowerCase();
const gmailUser = process.env.GMAIL_USER || '';
const gmailAppPassword = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
const resendApiKey = process.env.RESEND_API_KEY || '';
const brevoApiKey = process.env.BREVO_API_KEY || '';
const brevoSender = process.env.BREVO_SENDER || gmailUser;

// Infer the provider when it is not stated explicitly.
const resolvedProvider = provider
  || (brevoApiKey ? 'brevo' : '')
  || (gmailUser && gmailAppPassword ? 'gmail' : '')
  || (resendApiKey ? 'resend' : '')
  || 'none';

const defaultFrom = resolvedProvider === 'gmail' && gmailUser
  ? `UniGuide Rwanda <${gmailUser}>`
  : 'UniGuide Rwanda <onboarding@resend.dev>';

module.exports = {
  provider: resolvedProvider,
  gmailUser,
  gmailAppPassword,
  resendApiKey,
  brevoApiKey,
  brevoSender,

  from: process.env.MAIL_FROM || defaultFrom,
  replyTo: process.env.MAIL_REPLY_TO || '',
  appName: process.env.APP_NAME || 'UniGuide Rwanda',
  appUrl: process.env.APP_URL || 'http://localhost:5001',

  // Only these email domains may open a student account. Production must be set to
  // the college domain only; gmail.com is included by default so the flow can be
  // tested end to end with real inboxes before the college domain is available.
  studentEmailDomains: parseList(
    process.env.STUDENT_EMAIL_DOMAINS,
    'tct.ac.rw,rp.ac.rw,uniguide.rw,gmail.com',
  ),

  otpLength: 6,
  otpTtlMinutes: Number(process.env.OTP_TTL_MINUTES || 10),
  otpMaxAttempts: Number(process.env.OTP_MAX_ATTEMPTS || 5),
  otpResendCooldownSeconds: Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || 60),

  get isLive() {
    if (this.provider === 'brevo') return Boolean(this.brevoApiKey && this.brevoSender);
    if (this.provider === 'gmail') return Boolean(this.gmailUser && this.gmailAppPassword);
    if (this.provider === 'resend') return Boolean(this.resendApiKey);
    return false;
  },
};
