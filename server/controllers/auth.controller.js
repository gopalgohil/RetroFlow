import { asyncHandler } from '../middlewares/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import authService from '../services/auth.service.js';

class AuthController {
  register = asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    return ApiResponse.created(res, result, result.message);
  });

  verifyEmail = asyncHandler(async (req, res) => {
    const result = await authService.verifyEmail(req.body);
    return ApiResponse.ok(res, result, result.message);
  });

  resendVerificationOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await authService.resendVerificationOtp(email);
    return ApiResponse.ok(res, result, result.message);
  });

  login = asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    return ApiResponse.ok(res, result, 'Logged in successfully!');
  });

  googleAuth = asyncHandler(async (req, res) => {
    const result = await authService.googleAuth(req.body);
    return ApiResponse.ok(res, result, 'Signed in with Google successfully!');
  });

  forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await authService.requestPasswordResetOtp(email);
    return ApiResponse.ok(
      res,
      result,
      `A 6-digit verification code has been dispatched to ${email}`
    );
  });

  resetPassword = asyncHandler(async (req, res) => {
    const result = await authService.resetPassword(req.body);
    return ApiResponse.ok(
      res,
      result,
      'Password reset successful. You can now log in with your new credentials.'
    );
  });

  getMe = asyncHandler(async (req, res) => {
    const profile = await authService.getProfile(req.user._id);
    return ApiResponse.ok(res, profile, 'User profile fetched successfully');
  });

  updateProfile = asyncHandler(async (req, res) => {
    const updated = await authService.updateProfile(req.user._id, req.body);
    return ApiResponse.ok(res, updated, 'Profile updated successfully');
  });

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
