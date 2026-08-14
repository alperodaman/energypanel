import crypto from 'node:crypto';
import { prisma } from '../db.js';
import { publish } from '../lib/rabbitmq.js';

const DEFAULT_INTERVAL_MS = 10000;
const THERMOSTAT_MIN = 18;
const THERMOSTAT_MAX = 26;
const THERMOSTAT_MAX_STEP = 0.5;

function randomInRange(min, max) {
  return min + Math.random() * (max - min);
}

async function nextThermostatValue(deviceId) {
  const lastReading = await prisma.reading.findFirst({
    where: { deviceId },
    orderBy: { occurredAt: 'desc' },
  });

  if (!lastReading) {
    return randomInRange(THERMOSTAT_MIN, THERMOSTAT_MAX);
  }

  const step = randomInRange(-THERMOSTAT_MAX_STEP, THERMOSTAT_MAX_STEP);
  const next = lastReading.value + step;
  return Math.min(THERMOSTAT_MAX, Math.max(THERMOSTAT_MIN, next));
}

async function generateReading(device) {
  if (device.deviceType === 'energy_meter') {
    return { value: randomInRange(0.5, 5.0), unit: 'kWh', metadata: undefined };
  }

  if (device.deviceType === 'thermostat') {
    const value = await nextThermostatValue(device.deviceId);
    return { value, unit: 'celsius', metadata: undefined };
  }

  if (device.deviceType === 'boiler') {
    const value = Math.random() < 0.5 ? 0 : 1;
    return { value, unit: 'boolean', metadata: { targetTemperature: device.targetTemperature ?? null } };
  }

  return null;
}

async function tick() {
  const devices = await prisma.trackedDevice.findMany();

  await Promise.all(
    devices.map(async (device) => {
      const reading = await generateReading(device);
      if (!reading) return;

      const occurredAt = new Date();

      await prisma.reading.create({
        data: {
          facilityId: device.facilityId,
          deviceId: device.deviceId,
          deviceType: device.deviceType,
          value: reading.value,
          unit: reading.unit,
          metadata: reading.metadata,
          occurredAt,
        },
      });

      // Bkz. shared-contracts/events.js#TelemetryReadingCreatedEvent
      publish(`telemetry.reading.created.${device.facilityId}.${device.deviceType}`, {
        eventId: crypto.randomUUID(),
        occurredAt: occurredAt.toISOString(),
        facilityId: device.facilityId,
        deviceId: device.deviceId,
        deviceType: device.deviceType,
        value: reading.value,
        unit: reading.unit,
        metadata: reading.metadata ?? null,
      });
    })
  );
}

function startTelemetrySimulator() {
  const intervalMs = Number(process.env.TELEMETRY_INTERVAL_MS) || DEFAULT_INTERVAL_MS;
  return setInterval(() => {
    tick().catch((err) => {
      console.error('[telemetry-simulator] tick failed:', err);
    });
  }, intervalMs);
}

export { startTelemetrySimulator };
