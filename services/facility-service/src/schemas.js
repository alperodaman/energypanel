import { z } from 'zod';

const createFacilitySchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1).optional(),
  type: z.enum(['home', 'business']),
});

const createDeviceSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['energy_meter', 'thermostat', 'boiler']),
  targetTemperature: z.number().optional(),
});

export { createFacilitySchema, createDeviceSchema };
