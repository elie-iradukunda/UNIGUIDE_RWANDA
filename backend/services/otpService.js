const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { EmailOtp } = require('../models');
const mail = require('../config/mail');

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const emailDomain = (email) => normalizeEmail(email).split('@')[1] || '';

/** True when the address belongs to a domain allowed to open a student account. */
function isAllowedStudentEmail(email) {
  return mail.studentEmailDomains.includes(emailDomain(email));
}

/** Cryptographically random code, so it cannot be guessed from the clock or a counter. */
function generateCode() {
  const max = 10 ** mail.otpLength;
  return String(crypto.randomInt(0, max)).padStart(mail.otpLength, '0');
}

/**
 * Issue a fresh OTP for this address and purpose. Any previous unconsumed code is
 * invalidated first, so only the newest code ever works.
 * Returns { code } — the caller emails it and must never persist or return it.
 */
async function issueOtp(email, purpose) {
  const address = normalizeEmail(email);

  const latest = await EmailOtp.findOne({
    where: { email: address, purpose, consumedAt: null },
    order: [['createdAt', 'DESC']],
  });
  if (latest) {
    const ageSeconds = (Date.now() - new Date(latest.createdAt).getTime()) / 1000;
    if (ageSeconds < mail.otpResendCooldownSeconds) {
      const wait = Math.ceil(mail.otpResendCooldownSeconds - ageSeconds);
      const error = new Error(`Please wait ${wait} seconds before requesting another code.`);
      error.retryAfter = wait;
      error.code = 'OTP_COOLDOWN';
      throw error;
    }
  }

  await EmailOtp.destroy({ where: { email: address, purpose, consumedAt: null } });

  const code = generateCode();
  await EmailOtp.create({
    email: address,
    codeHash: await bcrypt.hash(code, 10),
    purpose,
    expiresAt: new Date(Date.now() + mail.otpTtlMinutes * 60 * 1000),
  });

  return { code };
}

/**
 * Check a submitted code. Returns { ok } or { ok: false, message }.
 * A wrong code burns an attempt; too many attempts destroy the code entirely, so a
 * six-digit secret cannot be brute-forced.
 */
async function verifyOtp(email, purpose, submitted) {
  const address = normalizeEmail(email);
  const code = String(submitted || '').trim();
  if (!code) return { ok: false, message: 'Enter the code from your email.' };

  const record = await EmailOtp.findOne({
    where: { email: address, purpose, consumedAt: null },
    order: [['createdAt', 'DESC']],
  });
  if (!record) return { ok: false, message: 'No verification code is pending. Request a new one.' };

  if (new Date(record.expiresAt).getTime() < Date.now()) {
    await record.destroy();
    return { ok: false, message: 'That code has expired. Request a new one.' };
  }

  if (record.attempts >= mail.otpMaxAttempts) {
    await record.destroy();
    return { ok: false, message: 'Too many incorrect attempts. Request a new code.' };
  }

  if (!(await bcrypt.compare(code, record.codeHash))) {
    await record.increment('attempts');
    const left = mail.otpMaxAttempts - (record.attempts + 1);
    return {
      ok: false,
      message: left > 0
        ? `Incorrect code. ${left} attempt${left === 1 ? '' : 's'} remaining.`
        : 'Too many incorrect attempts. Request a new code.',
    };
  }

  await record.update({ consumedAt: new Date() });
  return { ok: true };
}

/** Housekeeping: drop codes that expired more than a day ago. */
async function purgeExpiredOtps() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return EmailOtp.destroy({ where: { expiresAt: { [Op.lt]: cutoff } } });
}

module.exports = {
  isAllowedStudentEmail,
  issueOtp,
  verifyOtp,
  purgeExpiredOtps,
  normalizeEmail,
  allowedDomains: () => mail.studentEmailDomains,
};
