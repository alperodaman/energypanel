import 'dotenv/config';
import express from 'express';
import authRouter from './routes/auth.js';
import { prisma } from './db.js';

const app = express();

if (process.env.NODE_ENV === 'production') {
  // Trust exactly one hop (the Nginx reverse proxy) for X-Forwarded-For.
  app.set('trust proxy', 1);
} else if (process.env.NODE_ENV === 'test') {
  // Lets tests isolate the login rate limiter per test via X-Forwarded-For.
  app.set('trust proxy', true);
}

app.use(express.json());

app.get('/health', async (req, res) => {
  const [postgres] = await Promise.allSettled([prisma.$queryRaw`SELECT 1`]);

  const dependencies = {
    postgres: postgres.status === 'fulfilled' ? 'ok' : 'error',
  };

  const isHealthy = Object.values(dependencies).every((status) => status === 'ok');

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    dependencies,
  });
});

app.use('/auth', authRouter);

export default app;
