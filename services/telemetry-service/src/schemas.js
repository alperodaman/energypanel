import { z } from 'zod';

const deviceCreatedEventSchema = z.object({
  eventId: z.string(),
  occurredAt: z.string(),
  facilityId: z.string(),
  deviceId: z.string(),
  deviceType: z.enum(['energy_meter', 'thermostat', 'boiler']),
  name: z.string(),
  targetTemperature: z.number().nullable(),
});

const facilityCreatedEventSchema = z.object({
  eventId: z.string(),
  occurredAt: z.string(),
  facilityId: z.string(),
  ownerUserId: z.string(),
});

const TYPE_TO_DEVICE_TYPE = {
  energy: 'energy_meter',
  temperature: 'thermostat',
  boiler: 'boiler',
};

const facilityTelemetryQuerySchema = z.object({
  type: z.enum(['energy', 'temperature', 'boiler']).optional(),
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
  granularity: z.enum(['hour', 'day']).default('hour'),
});

const deviceTelemetryHistoryQuerySchema = z.object({
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
});

export {
  deviceCreatedEventSchema,
  facilityCreatedEventSchema,
  facilityTelemetryQuerySchema,
  deviceTelemetryHistoryQuerySchema,
  TYPE_TO_DEVICE_TYPE,
};
