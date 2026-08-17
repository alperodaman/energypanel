import { apiFetch } from '../../lib/apiClient.js'

export function fetchFacilities () {
  return apiFetch('/facilities')
}

export function createFacility ({ name, address, type }) {
  return apiFetch('/facilities', {
    method: 'POST',
    body: JSON.stringify({ name, address, type }),
  })
}

export function fetchFacility (facilityId) {
  return apiFetch(`/facilities/${facilityId}`)
}

export function updateFacility (facilityId, { name, address, type }) {
  return apiFetch(`/facilities/${facilityId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name, address, type }),
  })
}

export function deleteFacility (facilityId) {
  return apiFetch(`/facilities/${facilityId}`, { method: 'DELETE' })
}

export function fetchDevices (facilityId) {
  return apiFetch(`/facilities/${facilityId}/devices`)
}

export function fetchDeviceTypeSummary () {
  return apiFetch('/facilities/summary/devices')
}

export function fetchLatestTelemetry (facilityId) {
  return apiFetch(`/facilities/${facilityId}/telemetry/latest`)
}

export function createDevice (facilityId, { name, type, targetTemperature }) {
  return apiFetch(`/facilities/${facilityId}/devices`, {
    method: 'POST',
    body: JSON.stringify({ name, type, targetTemperature }),
  })
}

export function deleteDevice (deviceId) {
  return apiFetch(`/devices/${deviceId}`, { method: 'DELETE' })
}
