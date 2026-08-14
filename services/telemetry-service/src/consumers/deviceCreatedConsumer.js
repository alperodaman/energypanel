import { consume } from '../lib/rabbitmq.js';
import { deviceCreatedEventSchema } from '../schemas.js';
import { upsertFromDeviceCreatedEvent } from '../services/trackedDeviceService.js';

const QUEUE_NAME = 'telemetry.device-created.queue';
const ROUTING_PATTERN = 'device.created.#';

// payload: shared-contracts/events.js#DeviceCreatedEvent
async function handleDeviceCreated(payload) {
  const event = deviceCreatedEventSchema.parse(payload);
  await upsertFromDeviceCreatedEvent(event);
}

function startDeviceCreatedConsumer() {
  return consume(QUEUE_NAME, ROUTING_PATTERN, handleDeviceCreated);
}

export { startDeviceCreatedConsumer };
