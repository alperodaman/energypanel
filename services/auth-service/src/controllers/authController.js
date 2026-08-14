import { registerSchema, loginSchema, refreshSchema } from '../schemas.js';
import * as authService from '../services/authService.js';

async function register(req, res) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_request', details: parsed.error.issues });
  }

  try {
    const user = await authService.register(parsed.data);
    return res.status(201).json(user);
  } catch (err) {
    if (err.code === 'CONFLICT') {
      return res.status(409).json({ error: err.message });
    }
    throw err;
  }
}

async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_request', details: parsed.error.issues });
  }

  try {
    const tokens = await authService.login(parsed.data);
    return res.status(200).json(tokens);
  } catch (err) {
    if (err.code === 'UNAUTHORIZED') {
      return res.status(401).json({ error: err.message });
    }
    throw err;
  }
}

async function refresh(req, res) {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_request', details: parsed.error.issues });
  }

  try {
    const tokens = await authService.refresh(parsed.data);
    return res.status(200).json(tokens);
  } catch (err) {
    if (err.code === 'UNAUTHORIZED') {
      return res.status(401).json({ error: err.message });
    }
    throw err;
  }
}

async function getMe(req, res) {
  try {
    const user = await authService.getMe({ userId: req.user.userId });
    return res.status(200).json(user);
  } catch (err) {
    if (err.code === 'UNAUTHORIZED') {
      return res.status(401).json({ error: err.message });
    }
    throw err;
  }
}

export { register, login, refresh, getMe };
