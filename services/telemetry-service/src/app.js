import 'dotenv/config';
import express from 'express';
import { requireEnv } from '@enerjipanel/shared-middleware';
import devicesRouter from './routes/devices.js';
import facilitiesRouter from './routes/facilities.js';
import { prisma } from './db.js';
import { checkConnection as checkRabbitmq } from './lib/rabbitmq.js';

requireEnv(['JWT_SECRET', 'INTERNAL_SERVICE_SECRET']);

const app = express();

if (process.env.NODE_ENV === 'production') {
  // Trust exactly one hop (the Nginx reverse proxy) for X-Forwarded-For.
  app.set('trust proxy', 1);
} else if (process.env.NODE_ENV === 'test') {
  app.set('trust proxy', true);
}

app.use(express.json());

app.get('/health', async (req, res) => {
  const [postgres, rabbitmq] = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    checkRabbitmq(),
  ]);

  const dependencies = {
    postgres: postgres.status === 'fulfilled' ? 'ok' : 'error',
    rabbitmq: rabbitmq.status === 'fulfilled' ? 'ok' : 'error',
  };

  const isHealthy = Object.values(dependencies).every((status) => status === 'ok');

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    dependencies,
  });
});

app.use('/facilities', facilitiesRouter);
app.use('/devices', devicesRouter);

export default app;
