import { Zap, Thermometer, Flame, Trash2 } from 'lucide-react'

import Card from '../../shared/components/Card.jsx'
import { formatReading } from './formatReading.js'
import './DeviceCard.css'

const DEVICE_META = {
  energy_meter: { icon: Zap, accent: 'ember', label: 'Meter' },
  thermostat: { icon: Thermometer, accent: 'teal', label: 'Thermostat' },
  boiler: { icon: Flame, accent: 'teal', label: 'Boiler' },
}

export default function DeviceCard ({ device, reading, onRemove }) {
  const meta = DEVICE_META[device.type] ?? { icon: Zap, accent: 'ember', label: device.type }
  const Icon = meta.icon

  return (
    <Card className={`device-card device-card--${meta.accent}`}>
      <div className="device-card__header">
        <span className="device-card__icon-badge">
          <Icon size={16} className="device-card__icon" aria-hidden="true" />
        </span>
        <span className="device-card__name">{device.name}</span>
        {onRemove && (
          <button
            type="button"
            className="device-card__remove"
            aria-label={`Remove ${device.name}`}
            onClick={() => onRemove(device)}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
      <span className="device-card__value data">
        {formatReading(reading)}
      </span>
      {device.targetTemperature != null && (
        <span className="device-card__target">Target: {device.targetTemperature}°C</span>
      )}
    </Card>
  )
}
