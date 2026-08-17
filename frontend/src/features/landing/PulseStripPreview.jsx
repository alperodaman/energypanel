import { Zap, Thermometer, Flame } from 'lucide-react'

import './PulseStripPreview.css'

// Sabit örnek değerlerle salt görsel bir önizleme — canlı PulseStrip'ten
// (features/facility/PulseStrip.jsx) kasıtlı olarak ayrı tutulur, veri/socket
// bağlantısı yok.
const PREVIEW_METRICS = [
  { icon: Zap, label: 'Live Consumption', accent: 'ember', value: '3.2 kWh' },
  { icon: Thermometer, label: 'Room Temperature', accent: 'teal', value: '21.5°C' },
  { icon: Flame, label: 'Boiler', accent: 'teal', value: 'On' },
]

export default function PulseStripPreview () {
  return (
    <div className="pulse-preview" aria-hidden="true">
      {PREVIEW_METRICS.map(({ icon: Icon, label, accent, value }) => (
        <div key={label} className={`pulse-preview__metric pulse-preview__metric--${accent}`}>
          <span className="pulse-preview__icon-badge">
            <Icon size={20} className="pulse-preview__icon" />
          </span>
          <div className="pulse-preview__body">
            <span className="pulse-preview__label">{label}</span>
            <span className="pulse-preview__value data">{value}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
