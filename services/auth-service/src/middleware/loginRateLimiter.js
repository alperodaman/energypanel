import rateLimit from 'express-rate-limit';

const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'too_many_requests',
    message: 'Çok fazla giriş denemesi yaptınız. Lütfen 1 dakika sonra tekrar deneyin.',
  },
});

export { loginRateLimiter };
