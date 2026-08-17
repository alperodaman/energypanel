import { z } from 'zod';

const telemetryReadingCreatedEventSchema = z.object({
  eventId: z.string(),
  occurredAt: z.string(),
  facilityId: z.string(),
  deviceId: z.string(),
  deviceType: z.enum(['energy_meter', 'thermostat', 'boiler']),
  value: z.number(),
  unit: z.string(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

const facilityCreatedEventSchema = z.object({
  eventId: z.string(),
  occurredAt: z.string(),
  facilityId: z.string(),
  ownerUserId: z.string(),
});

export { telemetryReadingCreatedEventSchema, facilityCreatedEventSchema };
