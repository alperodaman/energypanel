import { prisma } from '../db.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import {
  hashRefreshToken,
  generateRefreshToken,
  refreshTokenExpiry,
  signAccessToken,
} from '../lib/tokens.js';
import { createConflictError, createUnauthorizedError } from '../lib/errors.js';

async function register({ email, password, name }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw createConflictError('email_already_registered');
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
  });

  return { id: user.id, email: user.email, name: user.name };
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw createUnauthorizedError('invalid_credentials');
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);
  if (!passwordMatches) {
    throw createUnauthorizedError('invalid_credentials');
  }

  const accessToken = signAccessToken({ userId: user.id, email: user.email });

  const refreshToken = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: refreshTokenExpiry(),
    },
  });

  return { accessToken, refreshToken };
}

async function refresh({ refreshToken }) {
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashRefreshToken(refreshToken) },
  });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw createUnauthorizedError('invalid_refresh_token');
  }

  const newRefreshToken = generateRefreshToken();
  const [, user] = await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    }),
    prisma.user.findUniqueOrThrow({ where: { id: stored.userId } }),
    prisma.refreshToken.create({
      data: {
        userId: stored.userId,
        tokenHash: hashRefreshToken(newRefreshToken),
        expiresAt: refreshTokenExpiry(),
      },
    }),
  ]);

  const accessToken = signAccessToken({ userId: user.id, email: user.email });

  return { accessToken, refreshToken: newRefreshToken };
}

async function getMe({ userId }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw createUnauthorizedError('invalid_token');
  }

  return { id: user.id, email: user.email, name: user.name };
}

export { register, login, refresh, getMe };
