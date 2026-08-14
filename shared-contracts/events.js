/**
 * RabbitMQ event payload contracts for the `enerjipanel.events` topic exchange.
 * Bkz. enerjipanel-mimari.md §4.
 */

/**
 * Yayınlayan: Facility Service · Dinleyen: Telemetry Service
 *
 * @typedef {Object} DeviceCreatedEvent
 * @property {string} eventId
 * @property {string} occurredAt - ISO 8601
 * @property {string} facilityId
 * @property {string} deviceId
 * @property {'energy_meter'|'thermostat'|'boiler'} deviceType
 * @property {string} name
 * @property {number|null} targetTemperature
 */

/**
 * Yayınlayan: Facility Service · Dinleyen: Telemetry Service
 *
 * @typedef {Object} FacilityCreatedEvent
 * @property {string} eventId
 * @property {string} occurredAt - ISO 8601
 * @property {string} facilityId
 * @property {string} ownerUserId
 */

/**
 * Yayınlayan: Telemetry Service · Dinleyen: Alert & Insights Service (Faz 1), Realtime Service
 *
 * @typedef {Object} TelemetryReadingCreatedEvent
 * @property {string} eventId
 * @property {string} occurredAt - ISO 8601
 * @property {string} facilityId
 * @property {string} deviceId
 * @property {'energy_meter'|'thermostat'|'boiler'} deviceType
 * @property {number} value
 * @property {string} unit
 * @property {Object|null} metadata
 */

export {};
