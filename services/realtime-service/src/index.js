import http from 'node:http';
import app from './app.js';
import { createSocketServer } from './socket.js';
import { startTelemetryReadingConsumer } from './consumers/telemetryReadingConsumer.js';

const port = process.env.PORT || 3005;
const httpServer = http.createServer(app);

const io = await createSocketServer(httpServer);
startTelemetryReadingConsumer(io);

httpServer.listen(port, () => {
  console.log(`realtime-service listening on port ${port}`);
});
