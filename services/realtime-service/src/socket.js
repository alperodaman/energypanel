import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { authenticateSocket } from './middleware/authenticateSocket.js';
import { getPubClient, getSubClient } from './lib/redis.js';
import { getOwnerUserId } from './lib/facilityOwnership.js';

async function createSocketServer(httpServer) {
  const corsOrigins = (process.env.CORS_ORIGIN ?? '').split(',').map((origin) => origin.trim()).filter(Boolean);
  const io = new Server(httpServer, { cors: { origin: corsOrigins } });

  const [pubClient, subClient] = await Promise.all([getPubClient(), getSubClient()]);
  io.adapter(createAdapter(pubClient, subClient));

  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`socket connected: ${socket.id} (userId=${socket.data.userId})`);

    socket.on('subscribe:facility', async ({ facilityId }) => {
      const ownerUserId = await getOwnerUserId(facilityId);

      if (ownerUserId !== socket.data.userId) {
        socket.emit('subscribe:error', { facilityId, message: 'not authorized for this facility' });
        console.log(`socket ${socket.id} (userId=${socket.data.userId}) denied subscribe to facility:${facilityId}`);
        return;
      }

      const room = `facility:${facilityId}`;
      socket.join(room);
      console.log(`socket ${socket.id} (userId=${socket.data.userId}) joined ${room}`);
    });

    socket.on('unsubscribe:facility', ({ facilityId }) => {
      const room = `facility:${facilityId}`;
      socket.leave(room);
      console.log(`socket ${socket.id} (userId=${socket.data.userId}) left ${room}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`socket disconnected: ${socket.id} (userId=${socket.data.userId}) reason=${reason}`);
    });
  });

  return io;
}

export { createSocketServer };
