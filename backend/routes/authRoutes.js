const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const {
  register,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  login,
  getMe,
  updateMe,
} = require('../controllers/authController');

const { auth } = require('../middleware/authMiddleware');

// A six-digit code is only a million possibilities. The per-code attempt limit in
// otpService stops one code being guessed; this stops an attacker cycling through
// fresh codes, and slows password guessing on login.
const limiter = (windowMinutes, max, message) => rateLimit({
  windowMs: windowMinutes * 60 * 1000,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message },
});

const signupLimiter = limiter(15, 10, 'Too many registration attempts. Try again in 15 minutes.');
const codeLimiter = limiter(15, 15, 'Too many verification attempts. Try again in 15 minutes.');
const loginLimiter = limiter(15, 20, 'Too many sign-in attempts. Try again in 15 minutes.');

router.post('/register', signupLimiter, register);
router.post('/verify-otp', codeLimiter, verifyOtp);
router.post('/resend-otp', codeLimiter, resendOtp);
router.post('/forgot-password', signupLimiter, forgotPassword);
router.post('/reset-password', codeLimiter, resetPassword);
router.post('/login', loginLimiter, login);
router.get('/me', auth, getMe);
router.patch('/me', auth, updateMe);

module.exports = router;
