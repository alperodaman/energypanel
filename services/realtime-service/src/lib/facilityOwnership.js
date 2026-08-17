import { getPubClient } from './redis.js';

const OWNERS_KEY = 'facility:owners';

async function upsertFromFacilityCreatedEvent({ facilityId, ownerUserId }) {
  const client = await getPubClient();
  await client.hSet(OWNERS_KEY, facilityId, ownerUserId);
}

async function getOwnerUserId(facilityId) {
  const client = await getPubClient();
  return client.hGet(OWNERS_KEY, facilityId);
}

export { upsertFromFacilityCreatedEvent, getOwnerUserId };
