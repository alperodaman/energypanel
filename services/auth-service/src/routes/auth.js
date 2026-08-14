import crypto from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { registerSchema, loginSchema } from '../schemas.js';

const BCRYPT_COST_FACTOR = 12;
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const router = Router();

function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

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

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST_FACTOR);
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
  });

  return res.status(201).json({ id: user.id, email: user.email, name: user.name });
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_request', details: parsed.error.issues });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }

  const accessToken = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });

  const refreshToken = crypto.randomBytes(32).toString('hex');
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });

  return res.status(200).json({ accessToken, refreshToken });
});

export default router;
