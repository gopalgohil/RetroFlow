import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authLimiter } from '../middlewares/rateLimiter.middleware.js';
import { protect } from '../middlewares/auth.middleware.js';
import {
  registerSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validations/auth.js';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account (sends 6-digit OTP via Brevo)
 * @access  Public
 */
router.post(
  '/register',
  validate(registerSchema),
  authController.register
);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify 6-digit OTP code to activate registered account
 * @access  Public (Rate-limited)
 */
router.post(
  '/verify-email',
  authLimiter,
  validate(verifyEmailSchema),
  authController.verifyEmail
);

/**
 * @route   POST /api/auth/resend-verification-otp
 * @desc    Resend a fresh 6-digit OTP code for email verification
 * @access  Public (Rate-limited)
 */
router.post(
  '/resend-verification-otp',
  authLimiter,
  validate(resendVerificationSchema),
  authController.resendVerificationOtp
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user credentials (blocked if email not verified)
 * @access  Public (Rate-limited to prevent brute force)
 */
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  authController.login
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request 6-digit OTP code via Brevo email
 * @access  Public (Rate-limited to prevent OTP spam)
 */
router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Verify OTP and reset password
 * @access  Public (Rate-limited to prevent OTP brute force)
 */
router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword
);

/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated user profile
 * @access  Private (Requires Bearer token)
 */
router.get(
  '/me',
  protect,
  authController.getMe
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile name
 * @access  Private (Requires Bearer token)
 */
router.put(
  '/profile',
  protect,
  authController.updateProfile
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Update password with current password verification
 * @access  Private (Requires Bearer token)
 */
router.put(
  '/change-password',
  protect,
  authController.changePassword
);

export default router;
