import jwt from 'jsonwebtoken';

export const generateToken = (payload, expiresIn = '7d') => {
  const secret = process.env.JWT_SECRET || 'retroflow_default_jwt_secret_dev_key_2026';
  return jwt.sign(payload, secret, { expiresIn });
};

export const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET || 'retroflow_default_jwt_secret_dev_key_2026';
  return jwt.verify(token, secret);
};
