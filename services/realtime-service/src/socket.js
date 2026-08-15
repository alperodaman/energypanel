import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { authenticateSocket } from './middleware/authenticateSocket.js';
import { getPubClient, getSubClient } from './lib/redis.js';

async function createSocketServer(httpServer) {
  const io = new Server(httpServer);

  const [pubClient, subClient] = await Promise.all([getPubClient(), getSubClient()]);
  io.adapter(createAdapter(pubClient, subClient));

  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`socket connected: ${socket.id} (userId=${socket.data.userId})`);

    socket.on('subscribe:facility', ({ facilityId }) => {
      const room = `facility:${facilityId}`;
      // TODO: facilityId'nin gerçekten bu kullanıcıya ait olduğunu doğrula, telemetry-service'teki local ownership pattern'i burada da uygulanabilir
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
