import rateLimit from 'express-rate-limit';
import { ApiError } from '../utils/ApiError.js';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 20, 
  standardHeaders: true, 
  legacyHeaders: false, 
  handler: (req, res, next) => {
    next(
      new ApiError(
        429,
        'Too many authentication attempts from this IP. Please try again after 15 minutes.'
      )
    );
  },
});

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
