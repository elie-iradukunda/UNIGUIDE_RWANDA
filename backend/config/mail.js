// Central mail configuration.
//
// Two providers are supported:
//
//   MAIL_PROVIDER=gmail   Gmail SMTP with an App Password. Sends to ANY recipient,
//                         so this is what to use while testing with real inboxes.
//                         Requires 2-Step Verification on the Google account and an
//                         App Password (not the normal Gmail password). ~500 mails/day.
//
//   MAIL_PROVIDER=resend  Resend API. Use for production. Note that Resend only
//                         delivers to arbitrary recipients from a domain verified in
//                         the Resend dashboard; with the default onboarding sender it
//                         will only deliver to the Resend account owner's own address.
//
// With neither configured the service logs the message instead of sending, so local
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

// Infer the provider when it is not stated explicitly.
const resolvedProvider = provider
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
    if (this.provider === 'gmail') return Boolean(this.gmailUser && this.gmailAppPassword);
    if (this.provider === 'resend') return Boolean(this.resendApiKey);
    return false;
  },
};
