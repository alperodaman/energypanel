import 'dotenv/config';
import express from 'express';
import authRouter from './routes/auth.js';

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/auth', authRouter);

const port = process.env.PORT || 4001;
app.listen(port, () => {
  console.log(`auth-service listening on port ${port}`);
});

export default app;
