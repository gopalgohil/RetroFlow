import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from './asyncHandler.js';
import { verifyToken } from '../utils/token.js';
import User from '../models/User.js';
import { isSuperAdmin } from '../config/admin.config.js';
import { isAllowedCompanyEmail } from '../validations/auth.js';

const COMPANY_EMAIL_ONLY_MESSAGE =
  'Access restricted: Only official @digiflux.io or @internal.digiflux.io accounts are allowed.';

const LAST_ACTIVE_UPDATE_INTERVAL_MS = 5 * 60 * 1000;

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    throw ApiError.unauthorized('You must be logged in to access this resource.');
  }

  try {
    const decoded = verifyToken(token);
    let user = null;
    if (decoded.id && mongoose.Types.ObjectId.isValid(decoded.id)) {
      user = await User.findById(decoded.id).select(
        '-password -resetPasswordOtp -resetPasswordExpires'
      );
    }

    if (!user) {
      throw ApiError.unauthorized('User account not found or session has expired. Please log in again.');
    }

    if (!isAllowedCompanyEmail(user.email)) {
      throw ApiError.forbidden(COMPANY_EMAIL_ONLY_MESSAGE);
    }

    // Track "last active" for the Team Members page; throttled so we write at most once per window.
    const lastActiveMs = user.lastActiveAt ? new Date(user.lastActiveAt).getTime() : 0;
    if (Date.now() - lastActiveMs > LAST_ACTIVE_UPDATE_INTERVAL_MS) {
      User.updateOne({ _id: user._id }, { $set: { lastActiveAt: new Date() } }).catch(() => {});
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

export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    let decodedToken = null;
    try {
      decodedToken = verifyToken(token);
    } catch {
      decodedToken = null;
    }

    // A valid token for a non-company email is rejected instead of being treated as a user.
    if (decodedToken && !isAllowedCompanyEmail(decodedToken.email)) {
      throw ApiError.forbidden(COMPANY_EMAIL_ONLY_MESSAGE);
    }

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
      } else if (decoded && decoded.email) {
        const email = decoded.email.toLowerCase().trim();
        req.user = {
          id: decoded.id || `guest-${email.split('@')[0]}`,
          email,
          name: decoded.name || email.split('@')[0] || 'Guest Participant',
          role: decoded.role || 'member',
          isGuest: true,
        };
      }
    } catch {
    }
  }

  next();
});

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

export const requireAdmin = asyncHandler(async (req, res, next) => {
  const user = req.user;
  if (!user) {
    throw ApiError.unauthorized('Authentication required to access this resource.');
  }

  const email = (user.email || '').toLowerCase().trim();
  const role = (user.role || '').toLowerCase().trim();

  const isAdmin = role === 'admin' || isSuperAdmin(email);

  if (!isAdmin) {
    throw ApiError.forbidden('Access denied. This resource is reserved strictly for Workspace Administrators.');
  }

  next();
});

export default protect;
