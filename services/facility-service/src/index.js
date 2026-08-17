import app from './app.js';
import { prisma } from './db.js';
import { closeConnection, waitForPendingPublishes } from './lib/rabbitmq.js';

const port = process.env.PORT || 4002;
const SHUTDOWN_TIMEOUT_MS = 10000;

const server = app.listen(port, () => {
  console.log(`facility-service listening on port ${port}`);
});

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[facility-service] ${signal} received, shutting down gracefully`);

  const timeout = setTimeout(() => {
    console.error(`[facility-service] graceful shutdown timed out after ${SHUTDOWN_TIMEOUT_MS}ms, forcing exit`);
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  timeout.unref();

  server.close(async () => {
    try {
      await waitForPendingPublishes();
      await prisma.$disconnect();
      await closeConnection();
      clearTimeout(timeout);
      process.exit(0);
    } catch (err) {
      console.error('[facility-service] error during graceful shutdown:', err);
      clearTimeout(timeout);
      process.exit(1);
    }
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
