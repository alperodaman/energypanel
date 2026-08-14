import { createFacilitySchema } from '../schemas.js';
import * as facilityService from '../services/facilityService.js';

async function create(req, res) {
  const parsed = createFacilitySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_request', details: parsed.error.issues });
  }

  const facility = await facilityService.createFacility({
    ownerUserId: req.user.userId,
    ...parsed.data,
  });

  return res.status(201).json(facility);
}

async function list(req, res) {
  const facilities = await facilityService.listFacilities({ ownerUserId: req.user.userId });

  return res.status(200).json(facilities);
}

async function getById(req, res) {
  try {
    const facility = await facilityService.getFacility({
      id: req.params.id,
      ownerUserId: req.user.userId,
    });
    return res.status(200).json(facility);
  } catch (err) {
    if (err.code === 'NOT_FOUND') {
      return res.status(404).json({ error: err.message });
    }
    throw err;
  }
}

export { create, list, getById };
