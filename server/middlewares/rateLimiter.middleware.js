import rateLimit from 'express-rate-limit';
import { ApiError } from '../utils/ApiError.js';

/**
 * Strict rate limiter for sensitive authentication endpoints (Login, Forgot Password, OTP).
 * Mitigates brute-force credential stuffing and OTP SMS/email flooding attacks.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Max 20 attempts per IP within 15 minutes
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req, res, next) => {
    next(
      new ApiError(
        429,
        'Too many authentication attempts from this IP. Please try again after 15 minutes.'
      )
    );
  },
});

/**
 * General application rate limiter for standard public API endpoints.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 1000 : 50000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || process.env.NODE_ENV === 'development',
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many requests. Please slow down.'));
  },
});
