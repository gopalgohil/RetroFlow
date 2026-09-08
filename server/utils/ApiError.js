/**
 * @file ApiError.js
 * @description Centralized Operational Error class extending JavaScript Error.
 * Ensures consistent error properties across the application.
 */
export class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Human-readable error message
   * @param {Array|Object} [errors=[]] - Detailed validation or contextual error items
   * @param {string} [stack=''] - Optional stack trace override
   */
  constructor(statusCode, message = 'Something went wrong', errors = [], stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;
    this.isOperational = true;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // Factory methods for clean semantic instantiations
  static badRequest(msg, errors = []) {
    return new ApiError(400, msg, errors);
  }

  static unauthorized(msg = 'Unauthorized access') {
    return new ApiError(401, msg);
  }

  static forbidden(msg = 'Forbidden: Access denied') {
    return new ApiError(403, msg);
  }

  static notFound(msg = 'Resource not found') {
    return new ApiError(404, msg);
  }

  static conflict(msg = 'Resource already exists') {
    return new ApiError(409, msg);
  }

  static tooManyRequests(msg = 'Too many requests. Please try again later.') {
    return new ApiError(429, msg);
  }

  static internal(msg = 'Internal server error') {
    return new ApiError(500, msg);
  }
}

export default ApiError;
