import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from './asyncHandler.js';
import { verifyToken } from '../utils/token.js';
import User from '../models/User.js';

/**
 * Middleware to protect private routes requiring valid JWT authentication.
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check Authorization header for Bearer token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    // Fallback to HTTP-only cookie
    token = req.cookies.token;
  }

  if (!token) {
    throw ApiError.unauthorized('You must be logged in to access this resource.');
  }

  try {
    const decoded = verifyToken(token);
    // Find user excluding sensitive fields
    const user = await User.findById(decoded.id).select('-password -resetPasswordOtp -resetPasswordExpires');

    if (!user) {
      throw ApiError.unauthorized('The user belonging to this token no longer exists.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw ApiError.unauthorized('Invalid authentication token.');
    }
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Session expired. Please log in again.');
    }
    throw error;
  }
});

/**
 * Middleware for routes accessible to guests but enriched if token is provided
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('-password -resetPasswordOtp -resetPasswordExpires');
      if (user) {
        req.user = user;
      }
    } catch {
      // Ignore token errors for optional auth
    }
  }
  next();
});

export default protect;
