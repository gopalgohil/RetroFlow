/**
 * @file logger.middleware.js
 * @description Developer-friendly HTTP request and payload terminal logger.
 * Displays formatted logs for incoming requests, JSON payloads (masking sensitive fields),
 * and outgoing responses with latency in milliseconds.
 */

// Sensitive keys to mask in payload logs for security
const SENSITIVE_FIELDS = ['password', 'confirmPassword', 'newPassword', 'token'];

const sanitizePayload = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const key of Object.keys(sanitized)) {
    if (SENSITIVE_FIELDS.includes(key) && typeof sanitized[key] === 'string') {
      sanitized[key] = '••••••••';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizePayload(sanitized[key]);
    }
  }
  return sanitized;
};

export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const method = req.method;
  const url = req.originalUrl || req.url;

  // 1. Log incoming request and payload
  console.log(`\n📥 [${method}] ${url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    const cleanPayload = sanitizePayload(req.body);
    console.log(`📦 Payload:`, JSON.stringify(cleanPayload, null, 2));
  }

  // 2. Intercept response completion to log status and execution time
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const icon = statusCode < 400 ? '✅' : '❌';
    console.log(`📤 ${icon} [${statusCode}] ${method} ${url} (${duration}ms)`);
  });

  next();
};

export default requestLogger;
