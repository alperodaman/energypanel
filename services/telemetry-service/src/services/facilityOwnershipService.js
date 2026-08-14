import { prisma } from '../db.js';

async function upsertFromFacilityCreatedEvent({ facilityId, ownerUserId }) {
  return prisma.facilityOwnership.upsert({
    where: { facilityId },
    create: { facilityId, ownerUserId },
    update: { ownerUserId },
  });
}

export { upsertFromFacilityCreatedEvent };
