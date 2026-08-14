import { Router } from 'express';
import { prisma } from '../db.js';
import { registerSchema, loginSchema, refreshSchema } from '../schemas.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import {
  hashRefreshToken,
  generateRefreshToken,
  refreshTokenExpiry,
  signAccessToken,
} from '../lib/tokens.js';
import { createAuthenticateMiddleware } from '@enerjipanel/shared-middleware';
import { loginRateLimiter } from '../middleware/loginRateLimiter.js';

const authenticate = createAuthenticateMiddleware({ jwtSecret: process.env.JWT_SECRET });

const router = Router();

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_request', details: parsed.error.issues });
  }
  const { email, password, name } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'email_already_registered' });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
  });

  return res.status(201).json({ id: user.id, email: user.email, name: user.name });
});

router.post('/login', loginRateLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_request', details: parsed.error.issues });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ error: 'invalid_credentials' });
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

  return res.status(200).json({ accessToken, refreshToken });
});

router.post('/refresh', async (req, res) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_request', details: parsed.error.issues });
  }
  const { refreshToken } = parsed.data;

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashRefreshToken(refreshToken) },
  });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    return res.status(401).json({ error: 'invalid_refresh_token' });
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

  return res.status(200).json({ accessToken, refreshToken: newRefreshToken });
});

router.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!user) {
    return res.status(401).json({ error: 'invalid_token' });
  }

  return res.status(200).json({ id: user.id, email: user.email, name: user.name });
});

export default router;
