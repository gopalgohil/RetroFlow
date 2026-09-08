import { ApiError } from '../utils/ApiError.js';
import { ZodError } from 'zod';

/**
 * Global centralized error handling middleware for Express.
 * Intercepts all errors thrown across controllers and formats them
 * into a clean, uniform JSON response.
 */
export const errorHandler = (err, req, res, next) => {
  let error = err;

  // 1. Convert native ZodError into ApiError
  if (err instanceof ZodError) {
    const formattedErrors = {};
    err.issues.forEach((issue) => {
      const field = issue.path.join('.') || 'general';
      if (!formattedErrors[field]) {
        formattedErrors[field] = issue.message;
      }
    });
    error = new ApiError(400, err.issues[0]?.message || 'Validation failed', formattedErrors);
  }

  // 2. Handle Mongoose Bad ObjectId (CastError)
  else if (err.name === 'CastError') {
    error = new ApiError(400, `Invalid resource identifier: ${err.value}`);
  }

  // 3. Handle Mongoose Duplicate Key Error (Code 11000)
  else if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `An account with this ${duplicateField} already exists.`;
    error = new ApiError(409, message);
  }

  // 4. Handle Mongoose Schema Validation Error
  else if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    error = new ApiError(400, messages[0] || 'Database validation failed', messages);
  }

  // 5. Handle Malformed JSON payload
  else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = new ApiError(400, 'Malformed JSON payload in request body');
  }

  // 6. Generic/Unknown errors
  else if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, [], err.stack);
  }

  // Structured response output
  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors || [],
    ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {}),
    timestamp: new Date().toISOString(),
  };

  // Log server errors for observability
  if (error.statusCode >= 500) {
    console.error(`[Unhandled Exception] ${req.method} ${req.originalUrl}:`, err);
  }

  return res.status(error.statusCode).json(response);
};

export default errorHandler;
