import jwt from 'jsonwebtoken';
import {
  hashRefreshToken,
  generateRefreshToken,
  refreshTokenExpiry,
  signAccessToken,
  verifyAccessToken,
  REFRESH_TOKEN_TTL_MS,
} from '../../src/lib/tokens.js';

describe('hashRefreshToken', () => {
  it('is deterministic for the same input', () => {
    const token = 'abc123';
    expect(hashRefreshToken(token)).toBe(hashRefreshToken(token));
  });

  it('produces different hashes for different inputs', () => {
    expect(hashRefreshToken('a')).not.toBe(hashRefreshToken('b'));
  });

  it('never returns the raw token', () => {
    const token = 'plain-text-token';
    expect(hashRefreshToken(token)).not.toBe(token);
  });
});

describe('generateRefreshToken', () => {
  it('generates a 64-char hex string', () => {
    expect(generateRefreshToken()).toMatch(/^[0-9a-f]{64}$/);
  });

  it('generates unique tokens on each call', () => {
    expect(generateRefreshToken()).not.toBe(generateRefreshToken());
  });
});

describe('refreshTokenExpiry', () => {
  it('returns a date REFRESH_TOKEN_TTL_MS in the future', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    expect(refreshTokenExpiry(now).getTime()).toBe(now.getTime() + REFRESH_TOKEN_TTL_MS);
  });
});

describe('signAccessToken / verifyAccessToken', () => {
  const secret = 'test-secret';

  it('round-trips the payload', () => {
    const token = signAccessToken({ userId: 'u1', email: 'a@test.local' }, secret);
    const decoded = verifyAccessToken(token, secret);
    expect(decoded).toMatchObject({ userId: 'u1', email: 'a@test.local' });
  });

  it('rejects a token signed with a different secret', () => {
    const token = signAccessToken({ userId: 'u1' }, secret);
    expect(() => verifyAccessToken(token, 'wrong-secret')).toThrow();
  });

  it('rejects an expired token', () => {
    const token = jwt.sign({ userId: 'u1' }, secret, { expiresIn: '-1s' });
    expect(() => verifyAccessToken(token, secret)).toThrow();
  });

  it('rejects a token signed with alg "none"', () => {
    const token = jwt.sign({ userId: 'u1' }, undefined, { algorithm: 'none' });
    expect(() => verifyAccessToken(token, secret)).toThrow();
  });
});
