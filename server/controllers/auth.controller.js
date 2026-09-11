import { asyncHandler } from '../middlewares/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import authService from '../services/auth.service.js';

/**
 * @controller AuthController
 * @description Handles HTTP requests for authentication flows.
 * Delegates pure business rules to AuthService and formats responses via ApiResponse.
 */
class AuthController {
  /**
   * Register new user account
   * POST /api/auth/register
   */
  register = asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    return ApiResponse.created(res, result, result.message);
  });

  /**
   * Verify 6-digit OTP code for newly registered account
   * POST /api/auth/verify-email
   */
  verifyEmail = asyncHandler(async (req, res) => {
    const result = await authService.verifyEmail(req.body);
    return ApiResponse.ok(res, result, result.message);
  });

  /**
   * Resend 6-digit OTP code for email verification
   * POST /api/auth/resend-verification-otp
   */
  resendVerificationOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await authService.resendVerificationOtp(email);
    return ApiResponse.ok(res, result, result.message);
  });

  /**
   * Authenticate user credentials & issue JWT
   * POST /api/auth/login
   */
  login = asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    return ApiResponse.ok(res, result, 'Logged in successfully!');
  });

  /**
   * Request 6-digit password reset OTP
   * POST /api/auth/forgot-password
   */
  forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await authService.requestPasswordResetOtp(email);
    return ApiResponse.ok(
      res,
      result,
      `A 6-digit verification code has been dispatched to ${email}`
    );
  });

  /**
   * Verify OTP and reset password
   * POST /api/auth/reset-password
   */
  resetPassword = asyncHandler(async (req, res) => {
    const result = await authService.resetPassword(req.body);
    return ApiResponse.ok(
      res,
      result,
      'Password reset successful. You can now log in with your new credentials.'
    );
  });

  /**
   * Fetch authenticated user's profile
   * GET /api/auth/me
   */
  getMe = asyncHandler(async (req, res) => {
    const profile = await authService.getProfile(req.user._id);
    return ApiResponse.ok(res, profile, 'User profile fetched successfully');
  });

  /**
   * Update profile details
   * PUT /api/auth/profile
   */
  updateProfile = asyncHandler(async (req, res) => {
    const updated = await authService.updateProfile(req.user._id, req.body);
    return ApiResponse.ok(res, updated, 'Profile updated successfully');
  });

  /**
   * Change user password
   * PUT /api/auth/change-password
   */
  changePassword = asyncHandler(async (req, res) => {
    const result = await authService.changePassword(req.user._id, {
      ...req.body,
      email: req.user?.email,
    });
    return ApiResponse.ok(res, result, result.message || 'Password changed successfully');
  });
}

export const authController = new AuthController();
export default authController;
