import { ApiError } from '../utils/ApiError.js';
import { ZodError } from 'zod';

const sanitizePayload = (body) => {
  if (!body || typeof body !== 'object') return undefined;
  const copy = { ...body };
  ['password', 'token', 'otp', 'newPassword', 'confirmPassword'].forEach((k) => {
    if (k in copy) copy[k] = '[REDACTED]';
  });
  return copy;
};

export const errorHandler = (err, req, res, next) => {
  let error = err;

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

  else if (err.name === 'CastError') {
    error = new ApiError(400, `Invalid resource identifier: ${err.value}`);
  }

  else if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `An account with this ${duplicateField} already exists.`;
    error = new ApiError(409, message);
  }

  else if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    error = new ApiError(400, messages[0] || 'Database validation failed', messages);
  }

  else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = new ApiError(400, 'Malformed JSON payload in request body');
  }

  else if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, [], err.stack);
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors || [],
    ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {}),
    timestamp: new Date().toISOString(),
  };

  const userContext = req.user
    ? {
        userId: req.user._id || req.user.id,
        userEmail: req.user.email,
        userRole: req.user.projectRole || req.user.role,
      }
    : 'Unauthenticated / Guest';

  const logContext = {
    endpoint: `${req.method} ${req.originalUrl}`,
    statusCode: error.statusCode,
    message: error.message,
    user: userContext,
    ...(req.body && Object.keys(req.body).length > 0 ? { payload: sanitizePayload(req.body) } : {}),
    timestamp: new Date().toISOString(),
  };

  if (error.statusCode >= 500) {
    console.error(`❌ [SERVER_ERROR] ${req.method} ${req.originalUrl}:`, {
      ...logContext,
      stack: err.stack,
    });
  } else if (error.statusCode >= 400) {
    console.warn(`⚠️ [CLIENT_ERROR] ${req.method} ${req.originalUrl} (${error.statusCode}):`, logContext);
  }

  return res.status(error.statusCode).json(response);
};

export default errorHandler;
