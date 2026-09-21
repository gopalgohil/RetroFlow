import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from './asyncHandler.js';
import { verifyToken } from '../utils/token.js';
import User from '../models/User.js';
import { isSuperAdmin } from '../config/admin.config.js';

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
    let user = null;
    if (decoded.id && mongoose.Types.ObjectId.isValid(decoded.id)) {
      user = await User.findById(decoded.id).select(
        '-password -resetPasswordOtp -resetPasswordExpires'
      );
    }

    if (!user) {
      // Resolve strictly from verified decoded JWT payload
      const email = (decoded.email || '').toLowerCase().trim();
      const isAdmin =
        isSuperAdmin(email) ||
        decoded.role === 'admin';
      user = {
        _id:
          decoded.id && mongoose.Types.ObjectId.isValid(decoded.id)
            ? new mongoose.Types.ObjectId(decoded.id)
            : isAdmin
            ? new mongoose.Types.ObjectId('65f1a2b3c4d5e6f7a8b9c0d1')
            : new mongoose.Types.ObjectId(),
        id: decoded.id || (isAdmin ? 'user-admin' : (email ? `guest-${email.split('@')[0]}` : 'guest-user')),
        email,
        name: decoded.name || (email ? email.split('@')[0] : 'Guest User'),
        role: isAdmin ? 'admin' : (decoded.role || 'member'),
        isGuest: Boolean(decoded.isGuest),
      };
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
      let user = null;
      if (decoded.id && mongoose.Types.ObjectId.isValid(decoded.id)) {
        user = await User.findById(decoded.id).select(
          '-password -resetPasswordOtp -resetPasswordExpires'
        );
      }
      if (user) {
        req.user = user;
      } else if (decoded && (decoded.email || decoded.id)) {
        const email = (decoded.email || '').toLowerCase().trim();
        const isAdmin =
          isSuperAdmin(email) || decoded.role === 'admin';
        req.user = {
          _id:
            decoded.id && mongoose.Types.ObjectId.isValid(decoded.id)
              ? new mongoose.Types.ObjectId(decoded.id)
              : isAdmin
              ? new mongoose.Types.ObjectId('65f1a2b3c4d5e6f7a8b9c0d1')
              : new mongoose.Types.ObjectId(),
          id: decoded.id || `guest-${email.split('@')[0]}`,
          email,
          name: decoded.name || email.split('@')[0] || 'Developer',
          role: isAdmin ? 'admin' : (decoded.role || 'member'),
          isGuest: Boolean(decoded.isGuest),
        };
      }
    } catch {
      // Ignore token errors for optional auth
    }
  }

  next();
});

/**
 * Guard middleware restricting access strictly to Workspace Administrators and Managers.
 * Non-managers, developers, QA, DevOps, and unverified users are rejected with 403 Forbidden.
 */
export const requireManagerOrAdmin = asyncHandler(async (req, res, next) => {
  const user = req.user;
  if (!user) {
    throw ApiError.unauthorized('Authentication required to access analytics.');
  }

  const email = (user.email || '').toLowerCase().trim();
  const role = (user.role || '').toLowerCase().trim();
  const projectRole = (user.projectRole || '').toLowerCase().trim();

  const isAdmin =
    role === 'admin' ||
    isSuperAdmin(email);

  const isManager =
    isAdmin ||
    role === 'manager' ||
    projectRole === 'manager';

  if (!isManager) {
    throw ApiError.forbidden('Access denied. Retro Analytics is reserved strictly for Workspace Administrators and Managers.');
  }

  next();
});

export default protect;
