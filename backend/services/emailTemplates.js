const mail = require('../config/mail');

const escape = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// One shell for every message so the emails read as a single system.
const shell = (title, bodyHtml) => `
<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f4f6fb;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <tr>
        <td style="background:#1f5ff0;padding:20px 28px;">
          <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:.3px;">${escape(mail.appName)}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:28px;">
          <h1 style="margin:0 0 16px;font-size:19px;line-height:1.35;color:#111827;">${escape(title)}</h1>
          ${bodyHtml}
        </td>
      </tr>
      <tr>
        <td style="padding:16px 28px 24px;border-top:1px solid #eef1f6;color:#6b7280;font-size:12px;line-height:1.6;">
          This is an automated message from ${escape(mail.appName)}, Tumba College of Technology.
          Please do not reply to this email.
        </td>
      </tr>
    </table>
  </body>
</html>`;

const paragraph = (text) =>
  `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#374151;">${text}</p>`;

const codeBlock = (code) => `
  <div style="margin:20px 0;padding:18px;background:#f4f6fb;border:1px dashed #c7d2fe;border-radius:10px;text-align:center;">
    <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#1f5ff0;font-family:Consolas,Menlo,monospace;">${escape(code)}</div>
  </div>`;

const detailRows = (rows) => `
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:8px 0 18px;border-collapse:collapse;">
    ${rows
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(
        ([label, value]) => `
      <tr>
        <td style="padding:8px 0;font-size:14px;color:#6b7280;width:42%;">${escape(label)}</td>
        <td style="padding:8px 0;font-size:14px;color:#111827;font-weight:600;">${escape(value)}</td>
      </tr>`,
      )
      .join('')}
  </table>`;

const statusBadge = (status) => {
  const palette = {
    Approved: ['#166534', '#dcfce7'],
    Borrowed: ['#1e40af', '#dbeafe'],
    Returned: ['#3730a3', '#e0e7ff'],
    Cancelled: ['#991b1b', '#fee2e2'],
    Pending: ['#92400e', '#fef3c7'],
  };
  const [colour, background] = palette[status] || ['#374151', '#f3f4f6'];
  return `<span style="display:inline-block;padding:4px 12px;border-radius:999px;background:${background};color:${colour};font-size:13px;font-weight:700;">${escape(status)}</span>`;
};

const firstName = (fullName) => String(fullName || 'there').trim().split(/\s+/)[0];

exports.registrationOtp = ({ fullName, code }) => ({
  subject: `Verify your ${mail.appName} student account`,
  html: shell(
    'Verify your student account',
    paragraph(`Hello ${escape(firstName(fullName))},`) +
      paragraph(`Welcome to ${escape(mail.appName)}. Use the one-time password below to activate your student account.`) +
      codeBlock(code) +
      paragraph(`This code expires in <strong>${mail.otpTtlMinutes} minutes</strong>. You have ${mail.otpMaxAttempts} attempts to enter it correctly.`) +
      paragraph('If you did not create this account, you can safely ignore this email.'),
  ),
});

exports.passwordResetOtp = ({ fullName, code }) => ({
  subject: `Reset your ${mail.appName} password`,
  html: shell(
    'Reset your password',
    paragraph(`Hello ${escape(firstName(fullName))},`) +
      paragraph('We received a request to reset your password. Use the one-time password below to set a new one.') +
      codeBlock(code) +
      paragraph(`This code expires in <strong>${mail.otpTtlMinutes} minutes</strong>.`) +
      paragraph('If you did not request a password reset, ignore this email and your password will stay unchanged.'),
  ),
});

exports.welcome = ({ fullName, department, studentId }) => ({
  subject: `Your ${mail.appName} account is active`,
  html: shell(
    'Your account is active',
    paragraph(`Hello ${escape(firstName(fullName))},`) +
      paragraph('Your student account has been verified and is now active. You can sign in and start using the platform.') +
      detailRows([
        ['Student ID', studentId],
        ['Department', department],
      ]) +
      paragraph('You can now scan equipment QR codes, find step-free laboratory directions, and request equipment.'),
  ),
});

exports.reservationSubmitted = ({ fullName, equipmentName, startDate, endDate, purpose }) => ({
  subject: `Request received: ${equipmentName}`,
  html: shell(
    'We received your equipment request',
    paragraph(`Hello ${escape(firstName(fullName))},`) +
      paragraph('Your request has been submitted and is waiting for laboratory staff to review it.') +
      detailRows([
        ['Equipment', equipmentName],
        ['From', startDate],
        ['Until', endDate],
        ['Purpose', purpose],
        ['Status', 'Pending'],
      ]) +
      paragraph('You will receive another email as soon as a decision is made.'),
  ),
});

exports.reservationPendingForStaff = ({ staffName, studentName, equipmentName, startDate, endDate }) => ({
  subject: `New equipment request: ${equipmentName}`,
  html: shell(
    'A new request needs your review',
    paragraph(`Hello ${escape(firstName(staffName))},`) +
      paragraph('A student has submitted an equipment request in your department.') +
      detailRows([
        ['Student', studentName],
        ['Equipment', equipmentName],
        ['From', startDate],
        ['Until', endDate],
      ]) +
      paragraph(`Open ${escape(mail.appName)} to approve or decline the request.`),
  ),
});

exports.reservationDecision = ({ fullName, equipmentName, status, reason }) => {
  const headline = {
    Approved: 'Your equipment request was approved',
    Cancelled: 'Your equipment request was declined',
    Borrowed: 'Your equipment has been issued',
    Returned: 'Your equipment return is confirmed',
  }[status] || `Your request is now ${status}`;

  const closing = {
    Approved: 'Collect the equipment from the laboratory during the approved period.',
    Cancelled: 'You may submit a new request if you still need this equipment.',
    Borrowed: 'Please return the equipment by the agreed date and in good condition.',
    Returned: 'Thank you for returning the equipment on time.',
  }[status] || '';

  return {
    subject: `${headline}: ${equipmentName}`,
    html: shell(
      headline,
      paragraph(`Hello ${escape(firstName(fullName))},`) +
        paragraph(`The status of your request for <strong>${escape(equipmentName)}</strong> is now ${statusBadge(status)}.`) +
        detailRows([
          ['Equipment', equipmentName],
          ['Status', status],
          ['Reason', reason],
        ]) +
        (closing ? paragraph(closing) : ''),
    ),
  };
};

exports.announcement = ({ title, content, department, authorName }) => ({
  subject: `Announcement: ${title}`,
  html: shell(
    escape(title),
    paragraph(escape(content)) +
      detailRows([
        ['Department', department],
        ['Published by', authorName],
      ]),
  ),
});

exports.directUserMessage = ({ recipientName, senderName, message }) => ({
  html: shell(
    'Message from UniGuide Rwanda',
    paragraph(`Hello ${escape(firstName(recipientName))},`) +
      paragraph(escape(message).replace(/\n/g, '<br>')) +
      detailRows([
        ['Sent by', senderName || 'UniGuide Rwanda administrator'],
      ]),
  ),
});
