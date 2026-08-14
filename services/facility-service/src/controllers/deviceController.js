import { createDeviceSchema } from '../schemas.js';
import * as deviceService from '../services/deviceService.js';

async function create(req, res) {
  const parsed = createDeviceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_request', details: parsed.error.issues });
  }

  try {
    const device = await deviceService.createDevice({
      facilityId: req.params.id,
      ownerUserId: req.user.userId,
      ...parsed.data,
    });
    return res.status(201).json(device);
  } catch (err) {
    if (err.code === 'NOT_FOUND') {
      return res.status(404).json({ error: err.message });
    }
    throw err;
  }
}

async function list(req, res) {
  try {
    const devices = await deviceService.listDevices({
      facilityId: req.params.id,
      ownerUserId: req.user.userId,
    });
    return res.status(200).json(devices);
  } catch (err) {
    if (err.code === 'NOT_FOUND') {
      return res.status(404).json({ error: err.message });
    }
    throw err;
  }
}

export { create, list };
