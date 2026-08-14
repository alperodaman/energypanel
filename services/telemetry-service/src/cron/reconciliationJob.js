import { upsertFromFacilityCreatedEvent } from '../services/facilityOwnershipService.js';
import { upsertFromDeviceCreatedEvent } from '../services/trackedDeviceService.js';

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;

async function fetchAllFacilities() {
  const res = await fetch(`${process.env.FACILITY_SERVICE_URL}/internal/facilities`, {
    headers: { 'X-Internal-Secret': process.env.INTERNAL_SERVICE_SECRET },
  });

  if (!res.ok) {
    throw new Error(`facility-service returned ${res.status}`);
  }

  return res.json();
}

async function tick() {
  const facilities = await fetchAllFacilities();

  let facilityCount = 0;
  let deviceCount = 0;

  for (const facility of facilities) {
    await upsertFromFacilityCreatedEvent({
      facilityId: facility.facilityId,
      ownerUserId: facility.ownerUserId,
    });
    facilityCount += 1;

    // TODO: additive-only for now — a facility/device deleted upstream is not removed
    // from the local read model here. Handling deletions is deferred to Faz 1/2.
    for (const device of facility.devices) {
      await upsertFromDeviceCreatedEvent({
        facilityId: facility.facilityId,
        deviceId: device.deviceId,
        deviceType: device.deviceType,
        targetTemperature: device.targetTemperature,
      });
      deviceCount += 1;
    }
  }

  console.log(
    `[reconciliation] synced ${facilityCount} facilities, ${deviceCount} devices from facility-service`
  );
}

function startReconciliationJob() {
  const intervalMs = Number(process.env.RECONCILIATION_INTERVAL_MS) || DEFAULT_INTERVAL_MS;
  return setInterval(() => {
    tick().catch((err) => {
      console.error('[reconciliation] tick failed, will retry next interval:', err);
    });
  }, intervalMs);
}

export { startReconciliationJob };
