import 'dotenv/config';
import express from 'express';
import devicesRouter from './routes/devices.js';
import facilitiesRouter from './routes/facilities.js';

const app = express();

if (process.env.NODE_ENV === 'production') {
  // Trust exactly one hop (the Nginx reverse proxy) for X-Forwarded-For.
  app.set('trust proxy', 1);
} else if (process.env.NODE_ENV === 'test') {
  app.set('trust proxy', true);
}

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/facilities', facilitiesRouter);
app.use('/devices', devicesRouter);

export default app;
