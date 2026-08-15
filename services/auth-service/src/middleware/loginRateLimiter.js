import rateLimit from 'express-rate-limit';

const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'too_many_requests',
    message: 'Too many login attempts. Please try again in 1 minute.',
  },
});

export { loginRateLimiter };
