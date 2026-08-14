import * as facilityService from '../services/facilityService.js';

async function listAllFacilities(req, res) {
  const facilities = await facilityService.listAllFacilitiesWithDevices();

  return res.status(200).json(facilities);
}

export { listAllFacilities };
