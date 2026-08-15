import 'dotenv/config';
import express from 'express';
import { checkConnection as checkRabbitmq } from './lib/rabbitmq.js';
import { checkConnection as checkRedis } from './lib/redis.js';

const app = express();

app.get('/health', async (req, res) => {
  const [rabbitmq, redis] = await Promise.allSettled([checkRabbitmq(), checkRedis()]);

  const dependencies = {
    rabbitmq: rabbitmq.status === 'fulfilled' ? 'ok' : 'error',
    redis: redis.status === 'fulfilled' ? 'ok' : 'error',
  };

  const isHealthy = Object.values(dependencies).every((status) => status === 'ok');

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    dependencies,
  });
});

export default app;
