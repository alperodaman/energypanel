import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { prisma } from '../../src/db.js';
import { tick } from '../../src/cron/reconciliationJob.js';

// This suite exercises reconciliationJob.tick() against a REAL facility-service:
// a separate Node process, spawned from its own source, listening on a real port and
// talking to its own real Postgres/RabbitMQ. The test only ever talks to it over HTTP —
// exactly like reconciliationJob.tick() itself does in production — so no facility-service
// internals (services, controllers, its Prisma client) are imported here.

const here = path.dirname(fileURLToPath(import.meta.url));
const facilityServiceRoot = path.resolve(here, '../../../facility-service');

let facilityProcess;
let facilityServiceUrl;
let facilityJwtSecret;
let originalFacilityServiceUrl;

const createdEntities = []; // { facilityId, deviceId, token }
const staleFacilityIds = [];

function isPortFree(port) {
  return new Promise((resolve) => {
    const tester = net
      .createServer()
      .once('error', () => resolve(false))
      .once('listening', () => tester.close(() => resolve(true)))
      .listen(port, '127.0.0.1');
  });
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close((err) => (err ? reject(err) : resolve(port)));
    });
  });
}

async function waitForHealthy(url, { timeoutMs = 20000, intervalMs = 300 } = {}) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
      lastError = new Error(`health check returned ${res.status}`);
    } catch (err) {
      lastError = err;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(`facility-service did not become healthy at ${url}: ${lastError?.message}`);
}

async function stopFacilityService() {
  if (!facilityProcess || facilityProcess.exitCode !== null || facilityProcess.signalCode !== null) {
    return;
  }

  const exited = new Promise((resolve) => facilityProcess.once('exit', resolve));
  facilityProcess.kill('SIGTERM');

  const timedOut = await Promise.race([
    exited.then(() => false),
    new Promise((resolve) => setTimeout(() => resolve(true), 10000)),
  ]);

  if (timedOut) {
    facilityProcess.kill('SIGKILL');
    await exited;
  }
}

beforeAll(async () => {
  const facilityEnv = dotenv.parse(fs.readFileSync(path.join(facilityServiceRoot, '.env')));
  facilityJwtSecret = facilityEnv.JWT_SECRET;

  const preferredPort = Number(facilityEnv.PORT) || 4002;
  const port = (await isPortFree(preferredPort)) ? preferredPort : await getFreePort();
  facilityServiceUrl = `http://127.0.0.1:${port}`;

  const logTail = [];
  facilityProcess = spawn(process.execPath, ['src/index.js'], {
    cwd: facilityServiceRoot,
    env: { ...process.env, ...facilityEnv, PORT: String(port), NODE_ENV: 'test' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  for (const stream of [facilityProcess.stdout, facilityProcess.stderr]) {
    stream.on('data', (chunk) => {
      logTail.push(chunk.toString());
      if (logTail.length > 50) logTail.shift();
    });
  }

  const earlyExit = new Promise((_resolve, reject) => {
    facilityProcess.once('exit', (code, signal) => {
      reject(new Error(`facility-service exited early (code=${code}, signal=${signal}):\n${logTail.join('')}`));
    });
  });

  try {
    await Promise.race([waitForHealthy(`${facilityServiceUrl}/health`), earlyExit]);
  } catch (err) {
    console.error(logTail.join(''));
    throw err;
  }

  originalFacilityServiceUrl = process.env.FACILITY_SERVICE_URL;
  process.env.FACILITY_SERVICE_URL = facilityServiceUrl;
}, 30000);

afterAll(async () => {
  process.env.FACILITY_SERVICE_URL = originalFacilityServiceUrl;
  await stopFacilityService();
  await prisma.$disconnect();
}, 15000);

afterEach(async () => {
  const deviceIds = [];
  const facilityIds = [];

  while (createdEntities.length > 0) {
    const { facilityId, deviceId, token } = createdEntities.pop();
    const headers = { Authorization: `Bearer ${token}` };
    await fetch(`${facilityServiceUrl}/devices/${deviceId}`, { method: 'DELETE', headers });
    await fetch(`${facilityServiceUrl}/facilities/${facilityId}`, { method: 'DELETE', headers });
    deviceIds.push(deviceId);
    facilityIds.push(facilityId);
  }

  if (deviceIds.length > 0) {
    await prisma.trackedDevice.deleteMany({ where: { deviceId: { in: deviceIds } } });
  }
  if (facilityIds.length > 0) {
    await prisma.facilityOwnership.deleteMany({ where: { facilityId: { in: facilityIds } } });
  }
  if (staleFacilityIds.length > 0) {
    await prisma.facilityOwnership.deleteMany({ where: { facilityId: { in: staleFacilityIds } } });
    staleFacilityIds.length = 0;
  }
});

function makeAuthToken(userId) {
  return jwt.sign({ userId }, facilityJwtSecret, { algorithm: 'HS256', expiresIn: '5m' });
}

async function createRealFacilityWithDevice() {
  const ownerUserId = crypto.randomUUID();
  const token = makeAuthToken(ownerUserId);
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const facilityRes = await fetch(`${facilityServiceUrl}/facilities`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: `reconciliation-test-${Date.now()}`, type: 'home' }),
  });
  if (!facilityRes.ok) {
    throw new Error(`failed to create facility via HTTP: ${facilityRes.status} ${await facilityRes.text()}`);
  }
  const facility = await facilityRes.json();

  const deviceRes = await fetch(`${facilityServiceUrl}/facilities/${facility.id}/devices`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'reconciliation-test-thermostat',
      type: 'thermostat',
      targetTemperature: 21.5,
    }),
  });
  if (!deviceRes.ok) {
    throw new Error(`failed to create device via HTTP: ${deviceRes.status} ${await deviceRes.text()}`);
  }
  const device = await deviceRes.json();

  createdEntities.push({ facilityId: facility.id, deviceId: device.id, token });

  return { facility, device, ownerUserId };
}

describe('reconciliation job', () => {
  it('recovers a facility/device whose creation event never reached the local read model', async () => {
    const { facility, device, ownerUserId } = await createRealFacilityWithDevice();

    // A real telemetry-service consumer may be running in this dev environment and could
    // race us to populate these rows from the facility.created/device.created events we just
    // triggered — so we can't assert a "before" null state without racing it ourselves.
    // Deleting right before tick() deterministically simulates the event having been lost,
    // regardless of whether a consumer already won that race.
    await prisma.trackedDevice.deleteMany({ where: { deviceId: device.id } });
    await prisma.facilityOwnership.deleteMany({ where: { facilityId: facility.id } });

    await tick();

    const ownership = await prisma.facilityOwnership.findUnique({ where: { facilityId: facility.id } });
    const trackedDevice = await prisma.trackedDevice.findUnique({ where: { deviceId: device.id } });

    expect(ownership).toMatchObject({ facilityId: facility.id, ownerUserId });
    expect(trackedDevice).toMatchObject({
      facilityId: facility.id,
      deviceId: device.id,
      deviceType: 'thermostat',
      targetTemperature: 21.5,
    });
  }, 20000);

  it('does not delete a local record whose facility no longer exists in facility-service (additive-only)', async () => {
    const staleFacilityId = crypto.randomUUID();
    await prisma.facilityOwnership.create({
      data: { facilityId: staleFacilityId, ownerUserId: crypto.randomUUID() },
    });
    staleFacilityIds.push(staleFacilityId);

    await tick();

    const stillThere = await prisma.facilityOwnership.findUnique({ where: { facilityId: staleFacilityId } });
    expect(stillThere).not.toBeNull();
  }, 20000);
});
