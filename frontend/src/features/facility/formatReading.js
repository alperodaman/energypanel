const UNIT_LABELS = {
  kWh: 'kWh',
  celsius: '°C',
}

export function formatReading (reading) {
  if (!reading) return 'No data'

  if (reading.unit === 'boolean') {
    return reading.value ? 'On' : 'Off'
  }

  const value = Math.round(reading.value * 10) / 10
  const unitLabel = UNIT_LABELS[reading.unit] ?? reading.unit ?? ''
  return unitLabel === '°C' ? `${value}${unitLabel}` : `${value} ${unitLabel}`.trim()
}
