import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateRefreshToken() {
  return crypto.randomBytes(32).toString('hex');
}

function refreshTokenExpiry(now = new Date()) {
  return new Date(now.getTime() + REFRESH_TOKEN_TTL_MS);
}

function signAccessToken(payload, secret = process.env.JWT_SECRET) {
  return jwt.sign(payload, secret, { expiresIn: ACCESS_TOKEN_TTL });
}

function verifyAccessToken(token, secret = process.env.JWT_SECRET) {
  return jwt.verify(token, secret, { algorithms: ['HS256'] });
}

export {
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL_MS,
  hashRefreshToken,
  generateRefreshToken,
  refreshTokenExpiry,
  signAccessToken,
  verifyAccessToken,
};
