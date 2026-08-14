import { deviceTelemetryHistoryQuerySchema, facilityTelemetryQuerySchema } from '../schemas.js';
import * as telemetryService from '../services/telemetryService.js';

async function latestForFacility(req, res) {
  try {
    const readings = await telemetryService.getLatestReadings({
      facilityId: req.params.id,
      ownerUserId: req.user.userId,
    });
    return res.status(200).json(readings);
  } catch (err) {
    if (err.code === 'NOT_FOUND') {
      return res.status(404).json({ error: err.message });
    }
    throw err;
  }
}

async function telemetryForFacility(req, res) {
  const parsed = facilityTelemetryQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_request', details: parsed.error.issues });
  }

  try {
    const series = await telemetryService.getFacilityTelemetry({
      facilityId: req.params.id,
      ownerUserId: req.user.userId,
      ...parsed.data,
    });
    return res.status(200).json(series);
  } catch (err) {
    if (err.code === 'NOT_FOUND') {
      return res.status(404).json({ error: err.message });
    }
    throw err;
  }
}

async function historyForDevice(req, res) {
  const parsed = deviceTelemetryHistoryQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_request', details: parsed.error.issues });
  }

  try {
    const readings = await telemetryService.getDeviceTelemetryHistory({
      deviceId: req.params.id,
      ownerUserId: req.user.userId,
      ...parsed.data,
    });
    return res.status(200).json(readings);
  } catch (err) {
    if (err.code === 'NOT_FOUND') {
      return res.status(404).json({ error: err.message });
    }
    throw err;
  }
}

export { latestForFacility, telemetryForFacility, historyForDevice };
