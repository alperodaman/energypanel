import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requireEnv } from '@enerjipanel/shared-middleware';
import { createProxyRouter } from './routes/proxy.js';
import { getHealth } from './controllers/healthController.js';

requireEnv(['JWT_SECRET']);

const app = express();

// Security headers for the REST proxy path (WS traffic bypasses the gateway, see arch §2.1).
app.use(helmet());

if (process.env.NODE_ENV === 'production') {
  // Trust exactly one hop (the Nginx reverse proxy) for X-Forwarded-For.
  app.set('trust proxy', 1);
} else if (process.env.NODE_ENV === 'test') {
  app.set('trust proxy', true);
}

// Comma-separated list of allowed browser origins, e.g. "http://localhost:5173,https://app.enerjipanel.com".
const corsOrigins = (process.env.CORS_ORIGIN ?? '').split(',').map((origin) => origin.trim()).filter(Boolean);
app.use(cors({ origin: corsOrigins }));

app.get('/health', getHealth);

app.use(createProxyRouter());

app.use((req, res) => {
  res.status(404).json({ error: 'not_found' });
});

export default app;
