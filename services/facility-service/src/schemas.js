import { z } from 'zod';

const createFacilitySchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1).optional(),
  type: z.enum(['home', 'business']),
});

const updateFacilitySchema = z
  .object({
    name: z.string().min(1),
    address: z.string().min(1),
    type: z.enum(['home', 'business']),
  })
  .partial();

const createDeviceSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['energy_meter', 'thermostat', 'boiler']),
  targetTemperature: z.number().optional(),
});

const updateDeviceSchema = z
  .object({
    name: z.string().min(1),
    targetTemperature: z.number(),
  })
  .partial();

export {
  createFacilitySchema,
  updateFacilitySchema,
  createDeviceSchema,
  updateDeviceSchema,
};
