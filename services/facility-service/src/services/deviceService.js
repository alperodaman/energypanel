import { prisma } from '../db.js';
import { getFacility } from './facilityService.js';

async function createDevice({ facilityId, ownerUserId, name, type, targetTemperature }) {
  await getFacility({ id: facilityId, ownerUserId });

  return prisma.device.create({
    data: { facilityId, name, type, targetTemperature },
  });
}

async function listDevices({ facilityId, ownerUserId }) {
  await getFacility({ id: facilityId, ownerUserId });

  return prisma.device.findMany({ where: { facilityId } });
}

export { createDevice, listDevices };
