import { consume } from '../lib/rabbitmq.js';
import { facilityCreatedEventSchema } from '../schemas.js';
import { upsertFromFacilityCreatedEvent } from '../lib/facilityOwnership.js';

const QUEUE_NAME = 'realtime.facility-created.queue';
const ROUTING_PATTERN = 'facility.created.#';

// payload: shared-contracts/events.js#FacilityCreatedEvent
async function handleFacilityCreated(payload) {
  const event = facilityCreatedEventSchema.parse(payload);
  await upsertFromFacilityCreatedEvent(event);
}

function startFacilityCreatedConsumer() {
  return consume(QUEUE_NAME, ROUTING_PATTERN, handleFacilityCreated);
}

export { startFacilityCreatedConsumer };
