import 'dotenv/config';
import crypto from 'node:crypto';
import http from 'node:http';
import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { io as ioClient } from 'socket.io-client';
import { createSocketServer } from '../../src/socket.js';
import { getPubClient, getSubClient } from '../../src/lib/redis.js';
import { upsertFromFacilityCreatedEvent } from '../../src/lib/facilityOwnership.js';

let httpServer;
let io;
let port;
const createdFacilityIds = [];

function authToken(userId) {
  return jwt.sign({ userId, email: `${userId}@test.local` }, process.env.JWT_SECRET);
}

function connectClient(userId) {
  return ioClient(`http://localhost:${port}`, { auth: { token: authToken(userId) } });
}

async function seedFacility(ownerUserId) {
  const facilityId = crypto.randomUUID();
  await upsertFromFacilityCreatedEvent({ facilityId, ownerUserId });
  createdFacilityIds.push(facilityId);
  return facilityId;
}

beforeAll(async () => {
  httpServer = http.createServer();
  io = await createSocketServer(httpServer);
  await new Promise((resolve) => {
    httpServer.listen(0, resolve);
  });
  port = httpServer.address().port;
});

afterEach(async () => {
  if (createdFacilityIds.length > 0) {
    const client = await getPubClient();
    await client.hDel('facility:owners', createdFacilityIds);
    createdFacilityIds.length = 0;
  }
});

afterAll(async () => {
  io.close();
  await new Promise((resolve) => httpServer.close(resolve));

  const [pubClient, subClient] = await Promise.all([getPubClient(), getSubClient()]);
  await Promise.all([pubClient.quit(), subClient.quit()]);
});

describe('connection authentication', () => {
  it('rejects a connection attempt with no token', async () => {
    const client = ioClient(`http://localhost:${port}`, { auth: {} });

    const [error] = await new Promise((resolve) => {
      client.on('connect_error', (err) => resolve([err]));
    });

    expect(error.message).toBe('unauthorized');
    expect(client.connected).toBe(false);

    client.close();
  });
});

describe('subscribe:facility ownership check', () => {
  it('denies subscribe when the socket user is not the facility owner', async () => {
    const owner = crypto.randomUUID();
    const facilityId = await seedFacility(owner);

    const client = connectClient(crypto.randomUUID());
    await new Promise((resolve) => client.on('connect', resolve));

    const errorEvent = new Promise((resolve) => client.once('subscribe:error', resolve));
    client.emit('subscribe:facility', { facilityId });

    const payload = await errorEvent;
    expect(payload).toMatchObject({ facilityId });

    client.close();
  });

  it('denies subscribe when the facility has no ownership record in Redis', async () => {
    const facilityId = crypto.randomUUID();

    const client = connectClient(crypto.randomUUID());
    await new Promise((resolve) => client.on('connect', resolve));

    const errorEvent = new Promise((resolve) => client.once('subscribe:error', resolve));
    client.emit('subscribe:facility', { facilityId });

    const payload = await errorEvent;
    expect(payload).toMatchObject({ facilityId });

    client.close();
  });

  it('accepts subscribe and joins the room when the socket user owns the facility', async () => {
    const userId = crypto.randomUUID();
    const facilityId = await seedFacility(userId);

    const client = connectClient(userId);
    await new Promise((resolve) => client.on('connect', resolve));

    const errorHandler = jest.fn();
    client.on('subscribe:error', errorHandler);

    client.emit('subscribe:facility', { facilityId });
    // give the async handler a tick to run, then confirm the join by broadcasting to the room
    await new Promise((resolve) => setTimeout(resolve, 100));

    const update = new Promise((resolve) => client.once('telemetry:update', resolve));
    io.to(`facility:${facilityId}`).emit('telemetry:update', { facilityId, ping: true });

    await expect(update).resolves.toMatchObject({ facilityId, ping: true });
    expect(errorHandler).not.toHaveBeenCalled();

    client.close();
  });
});
