import { prisma } from '../db.js';
import { createNotFoundError } from '../lib/errors.js';

async function createFacility({ ownerUserId, name, address, type }) {
  return prisma.facility.create({
    data: { ownerUserId, name, address, type },
  });
}

async function listFacilities({ ownerUserId }) {
  return prisma.facility.findMany({
    where: { ownerUserId },
  });
}

async function getFacility({ id, ownerUserId }) {
  const facility = await prisma.facility.findUnique({ where: { id } });
  if (!facility || facility.ownerUserId !== ownerUserId) {
    throw createNotFoundError('facility_not_found');
  }

  return facility;
}

export { createFacility, listFacilities, getFacility };
