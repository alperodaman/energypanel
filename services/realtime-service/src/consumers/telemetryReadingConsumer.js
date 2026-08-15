import { consume } from '../lib/rabbitmq.js';
import { telemetryReadingCreatedEventSchema } from '../schemas.js';

const QUEUE_NAME = 'realtime.telemetry-reading.queue';
const ROUTING_PATTERN = 'telemetry.reading.created.#';

// payload: shared-contracts/events.js#TelemetryReadingCreatedEvent
function handleTelemetryReadingCreated(io) {
  return async (payload) => {
    const event = telemetryReadingCreatedEventSchema.parse(payload);
    const room = `facility:${event.facilityId}`;

    // Server -> Client şeması (bkz. enerjipanel-mimari.md §3): { facilityId, deviceId, deviceType, value, unit, timestamp }
    io.to(room).emit('telemetry:update', {
      facilityId: event.facilityId,
      deviceId: event.deviceId,
      deviceType: event.deviceType,
      value: event.value,
      unit: event.unit,
      timestamp: event.occurredAt,
    });
  };
}

function startTelemetryReadingConsumer(io) {
  return consume(QUEUE_NAME, ROUTING_PATTERN, handleTelemetryReadingCreated(io));
}

export { startTelemetryReadingConsumer };
