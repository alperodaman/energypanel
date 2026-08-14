import 'dotenv/config';
import express from 'express';
import authRouter from './routes/auth.js';

const app = express();

if (process.env.NODE_ENV === 'production') {
  // Trust exactly one hop (the Nginx reverse proxy) for X-Forwarded-For.
  app.set('trust proxy', 1);
} else if (process.env.NODE_ENV === 'test') {
  // Lets tests isolate the login rate limiter per test via X-Forwarded-For.
  app.set('trust proxy', true);
}

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/auth', authRouter);

export default app;
