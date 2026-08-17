import { useEffect, useRef, useState } from 'react'
import { Zap, Thermometer, Flame } from 'lucide-react'

import { formatReading } from './formatReading.js'
import './PulseStrip.css'

// Değer her değiştiğinde 400ms'lik tek bir opacity pulse tetikler
// (tasarım dokümanı §7 — uygulamadaki tek animasyon kaynağı).
function usePulse (value) {
  const [pulsing, setPulsing] = useState(false)
  const prevRef = useRef(value)

  useEffect(() => {
    if (value === undefined || value === null || prevRef.current === value) {
      prevRef.current = value
      return undefined
    }
    prevRef.current = value
    setPulsing(true)
    const timer = setTimeout(() => setPulsing(false), 400)
    return () => clearTimeout(timer)
  }, [value])

  return pulsing
}

function PulseMetric ({ icon: Icon, label, accent, reading }) {
  const pulsing = usePulse(reading?.value)

  return (
    <div className={`pulse-metric pulse-metric--${accent}`}>
      <span className="pulse-metric__icon-badge">
        <Icon size={20} className="pulse-metric__icon" aria-hidden="true" />
      </span>
      <div className="pulse-metric__body">
        <span className="pulse-metric__label">{label}</span>
        <span
          className={`pulse-metric__value data${pulsing ? ' pulse-metric__value--pulsing' : ''}`}
        >
          {formatReading(reading)}
        </span>
      </div>
    </div>
  )
}

export default function PulseStrip ({ consumption, roomTemperature, boiler, loading }) {
  if (loading) {
    return (
      <div className="pulse-strip pulse-strip--loading" aria-hidden="true">
        <div className="pulse-strip__skeleton" />
        <div className="pulse-strip__skeleton" />
        <div className="pulse-strip__skeleton" />
      </div>
    )
  }

  return (
    <div className="pulse-strip" aria-live="polite">
      <PulseMetric icon={Zap} label="Live Consumption" accent="ember" reading={consumption} />
      <PulseMetric icon={Thermometer} label="Room Temperature" accent="teal" reading={roomTemperature} />
      <PulseMetric icon={Flame} label="Boiler" accent="teal" reading={boiler} />
    </div>
  )
}
