const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const email = require('../services/emailService');
const otp = require('../services/otpService');
const mail = require('../config/mail');

const generateToken = (user) => {
  return jwt.sign({
    id: user.id,
    role: user.role,
    department: user.department,
    permissions: {
      canBorrow: user.canBorrow,
      canReserve: user.canReserve,
      canViewReports: user.canViewReports
    }
  }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

const publicUser = (user) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  department: user.department,
  avatar: user.avatar,
});

// While no mail provider is configured the code is returned so the offline
// presentation and the automated suite can complete the flow. Once a provider is
// live the code only ever exists in the student's inbox.
const echoCode = (code) => (email.isLive() ? {} : { devCode: code });

exports.register = async (req, res) => {
  try {
    const { fullName, password, department, studentId } = req.body;
    const address = otp.normalizeEmail(req.body.email);

    if (!fullName || !address || !password || password.length < 8) {
      return res.status(400).json({ message: 'Name, email, and an 8-character password are required.' });
    }

    // Identity gate: only addresses on an approved domain may open a student account.
    if (!otp.isAllowedStudentEmail(address)) {
      return res.status(403).json({
        message: `Registration is limited to a college email address (${otp.allowedDomains().join(', ')}).`,
      });
    }

    const existing = await User.findOne({ where: { email: address } });
    if (existing && existing.status !== 'Pending') {
      return res.status(409).json({ message: 'An account already exists for this email.' });
    }
    if (studentId) {
      const claimed = await User.findOne({ where: { studentId } });
      if (claimed && claimed.email !== address) {
        return res.status(409).json({ message: 'That student ID is already registered.' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));

    // The account is created Pending. Login rejects Pending accounts, so an
    // unverified address can neither browse equipment nor reserve it.
    const profile = {
      fullName,
      email: address,
      password: hashedPassword,
      role: 'Student',
      department: department || null,
      studentId: studentId || null,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=1f4fa3&color=fff`,
      canBorrow: true,
      canReserve: true,
      canViewReports: false,
      status: 'Pending',
      emailVerifiedAt: null,
    };

    // Re-registering an address that never got verified simply refreshes it.
    const user = existing ? await existing.update(profile) : await User.create(profile);

    let code;
    try {
      ({ code } = await otp.issueOtp(address, 'register'));
    } catch (error) {
      if (error.code === 'OTP_COOLDOWN') {
        return res.status(429).json({ message: error.message, retryAfter: error.retryAfter });
      }
      throw error;
    }

    const delivery = await email.send(address, email.templates.registrationOtp({ fullName, code }));

    return res.status(201).json({
      success: true,
      message: `We sent a ${mail.otpLength}-digit code to ${address}. Enter it to activate your account.`,
      email: address,
      emailSent: delivery.sent,
      ...echoCode(code),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const address = otp.normalizeEmail(req.body.email);
    const user = await User.findOne({ where: { email: address } });
    if (!user) return res.status(404).json({ message: 'No account is waiting for verification.' });
    if (user.status === 'Active') {
      return res.status(409).json({ message: 'This account is already verified. Please sign in.' });
    }

    const result = await otp.verifyOtp(address, 'register', req.body.code);
    if (!result.ok) return res.status(400).json({ message: result.message });

    await user.update({ status: 'Active', emailVerifiedAt: new Date() });

    email.sendInBackground(address, email.templates.welcome({
      fullName: user.fullName,
      department: user.department,
      studentId: user.studentId,
    }));

    return res.json({ token: generateToken(user), user: publicUser(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Verification failed', error: error.message });
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const address = otp.normalizeEmail(req.body.email);
    const user = await User.findOne({ where: { email: address } });
    if (!user || user.status !== 'Pending') {
      // Do not reveal whether the address exists.
      return res.json({ success: true, message: 'If that account is awaiting verification, a new code has been sent.' });
    }

    let code;
    try {
      ({ code } = await otp.issueOtp(address, 'register'));
    } catch (error) {
      if (error.code === 'OTP_COOLDOWN') {
        return res.status(429).json({ message: error.message, retryAfter: error.retryAfter });
      }
      throw error;
    }

    const delivery = await email.send(address, email.templates.registrationOtp({ fullName: user.fullName, code }));
    return res.json({
      success: true,
      message: `A new code was sent to ${address}.`,
      emailSent: delivery.sent,
      ...echoCode(code),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Could not resend the code', error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const address = otp.normalizeEmail(req.body.email);
    const user = await User.findOne({ where: { email: address } });

    // Always answer the same way, so this route cannot be used to discover which
    // addresses hold an account.
    const generic = { success: true, message: 'If an account exists for that email, a reset code has been sent.' };
    if (!user || user.status === 'Inactive') return res.json(generic);

    let code;
    try {
      ({ code } = await otp.issueOtp(address, 'reset'));
    } catch (error) {
      if (error.code === 'OTP_COOLDOWN') {
        return res.status(429).json({ message: error.message, retryAfter: error.retryAfter });
      }
      throw error;
    }

    await email.send(address, email.templates.passwordResetOtp({ fullName: user.fullName, code }));
    return res.json({ ...generic, ...echoCode(code) });
  } catch (error) {
    return res.status(500).json({ message: 'Could not start the password reset', error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const address = otp.normalizeEmail(req.body.email);
    const { code, password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'The new password must be at least 8 characters.' });
    }

    const user = await User.findOne({ where: { email: address } });
    if (!user) return res.status(400).json({ message: 'That code is not valid.' });

    const result = await otp.verifyOtp(address, 'reset', code);
    if (!result.ok) return res.status(400).json({ message: result.message });

    await user.update({
      password: await bcrypt.hash(password, await bcrypt.genSalt(10)),
      // A verified reset code also proves the address works.
      status: user.status === 'Pending' ? 'Active' : user.status,
      emailVerifiedAt: user.emailVerifiedAt || new Date(),
    });

    return res.json({ success: true, message: 'Your password has been changed. Please sign in.' });
  } catch (error) {
    return res.status(500).json({ message: 'Password reset failed', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const address = otp.normalizeEmail(req.body.email);
    const { password } = req.body;

    const user = await User.findOne({ where: { email: address } });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password || '', user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Checked only after the password matches, so it leaks nothing to a stranger.
    if (user.status === 'Pending') {
      return res.status(403).json({
        message: 'Verify your email before signing in. Enter the code we sent you.',
        requiresVerification: true,
        email: user.email,
      });
    }
    if (user.status !== 'Active') return res.status(400).json({ message: 'Invalid credentials' });

    return res.json({ token: generateToken(user), user: publicUser(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user || user.status !== 'Active') return res.status(404).json({ message: 'Active account not found.' });
    const fullName = String(req.body.fullName || user.fullName).trim();
    const address = otp.normalizeEmail(req.body.email || user.email);
    if (!fullName || !address) return res.status(400).json({ message: 'Name and email are required.' });
    const existing = await User.findOne({ where: { email: address } });
    if (existing && existing.id !== user.id) return res.status(409).json({ message: 'Email is already in use.' });
    await user.update({ fullName, email: address });
    const safeUser = user.toJSON();
    delete safeUser.password;
    return res.json(safeUser);
  } catch (error) {
    return res.status(400).json({ message: 'Profile could not be updated.', error: error.message });
  }
};
