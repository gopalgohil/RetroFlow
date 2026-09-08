import jwt from 'jsonwebtoken';

/**
 * Signs a JWT token for a given user payload
 * @param {Object} payload - User identification payload (e.g. { id, email })
 * @param {string} [expiresIn='7d'] - Expiration duration
 * @returns {string} Signed JWT string
 */
export const generateToken = (payload, expiresIn = '7d') => {
  const secret = process.env.JWT_SECRET || 'retroflow_default_jwt_secret_dev_key_2026';
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verifies a JWT token
 * @param {string} token - Bearer JWT token
 * @returns {Object} Decoded token payload
 */
export const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET || 'retroflow_default_jwt_secret_dev_key_2026';
  return jwt.verify(token, secret);
};
